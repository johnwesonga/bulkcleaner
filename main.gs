function onInstall() {
  //add new menu items
  onOpen();

}

/**
* onOpen()
* Adds menu items to the spreadsheet
*/
function onOpen() {
  var menuEntries = [
    {
      name: "Retrieve Users",
      functionName: "retrieveAccounts"
    },
    {
      name: "Notify Users",
      functionName: "notifyUsers"
    },
    {
      name: "Delete Accounts",
      functionName: "deleteInactiveAccounts"
    },
  ];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.addMenu("Inactive Accounts", menuEntries);

}
    

/**
* notifies users that accounts will be deleted
*/
function notifyUsers() {
  //send out bulk email
  var ss = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var startRow = 2;
  //skip the header row, get values from all the rows and columns
  var users = ss.getRange(startRow, 1, ss.getLastRow() - 1, ss.getLastColumn()).getValues();
  if (users.length > 0) {
    users.forEach(function(user) {
      var r = rateLimitExpBackoff(function() {
        return MailApp.sendEmail(user[1], 'Dormant Account Deletion',
          'In the next 24 hours this account will be deleted by the Administrator. Please log in to your account' +
          'to ensure it is not deleted.');
      });
    });
    MailApp.sendEmail(Session.getActiveUser().getEmail(), users.length + ' Dormant Users Notified', users.length + ' Dormant Users Notified');
  }
}

/**
* deleteInactiveAccounts()
* deletes all the accounts listed in the spreadsheet
*/
function deleteInactiveAccounts() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var startRow = 2;
  //skip the header row, get values from all the rows and columns
  var users = ss.getRange(startRow, 1, ss.getLastRow() - 1, ss.getLastColumn()).getValues();
  if (users.length > 0) {
    var response = ui.alert('CONFIRM ACTION', 'Are you sure you want delete ' + users.length + ' users?', ui.ButtonSet.YES_NO);
    if (response == ui.Button.YES) {
      //loop and delete
      users.forEach(function(user) {
        //delete the account 
        Logger.log(user[1]);
        var r = rateLimitExpBackoff(function() {
           return AdminDirectory.Users.remove(user[1]);
         });
        
      });
      ui.alert(users.length + ' users have been deleted from your domain');
      
      ss.clear();
    } else {
      //do nothing
      Logger.log('do nuttin!');
    }

  } else {
    Logger.log('No users to delete');
    ui.alert('No users to delete');
  }

}

/**
* retrieveAccounts()
* calls the function that builds the account search UI
*/
function retrieveAccounts() {
  buildSearchUi();
}


/**
* getInactiveAccounts()
* retrieves all the dormant accounts using AdminDirectory API and saves to the spreadsheet
* @param {object} event object
*/
function getInactiveAccounts(e) {

  var app = UiApp.getActiveApplication();
  var ui = SpreadsheetApp.getUi();
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet().clear();
  var userEmail = Session.getActiveUser().getEmail();
  var userDomain = userEmail.replace(/.*@/, "");
  var startDateCond = e.parameter.startDate.toString();
  //format the date to be in line with what Apps generates
  var formattedDate = Utilities.formatDate(new Date(startDateCond), "GMT", "yyyy-MM-dd'T'HH:mm:ss'Z'");

  var pageToken, page;
  var rows = [];
  do {
    page = AdminDirectory.Users.list({
      domain: userDomain,
      orderBy: 'givenName',
      maxResults: 100,
      pageToken: pageToken
    });
    var users = page.users;
    if (users) {
      users.forEach(function(user) {
        if (user.lastLoginTime < formattedDate) {
          var row = [user.name.fullName, user.primaryEmail, user.lastLoginTime];
          rows.push(row);
        }

      });

    } else {
      Logger.log('No users found.');
      ui.alert('No users found');
    }
    pageToken = page.nextPageToken;
  } while (pageToken);



  if (rows.length > 0) {
    // Append the headers.
    var headers = ['Fullname', 'Email', 'LastLoginTime'];
    sheet.appendRow(headers);

    // Append the results.
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  } else {
    Logger.log('No results returned.');
    ui.alert('No users returned');

  }
  app.close();
  return app;


}

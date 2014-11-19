/**
* buildSearchUi()
* builds the account search Ui
*/
function buildSearchUi() {
  var app = UiApp.createApplication().setTitle('Inactive Accounts Search');
  //Create a penel which will hold all the elements
  var panel = app.createVerticalPanel();

  //CreateLabels as indicator for dates
  var dateLabel1 = app.createLabel('Last Login Date');

  //Create dateboxes for dates  
  var startDate = app.createDateBox().setId('startDate');

  //Create a button
  var button = app.createButton('Find Users');

  //Create a label which will initially be hidden, it will hold the date 
  //values which will be visible after submit
  var dateInfo1 = app.createLabel().setId('lblStartDate').setVisible(false);

  //createHandler which will show the selected dates.
  var handler = app.createServerHandler('getInactiveAccounts');
  handler.addCallbackElement(panel);

  //Add this handler to the button
  button.addClickHandler(handler);

  //Add all the UI elements to the panel
  panel.add(dateLabel1)
    .add(startDate)
    .add(button)
    .add(dateInfo1);

  //Add the panel to the application
  app.add(panel);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.show(app);

}
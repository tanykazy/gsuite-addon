/**
 * @OnlyCurrentDoc
 *
 * The above comment directs Apps Script to limit the scope of file
 * access for this add-on. It specifies that this add-on will only
 * attempt to read or modify the files in which the add-on is used,
 * and not all of the user's files. The authorization request message
 * presented to users will reflect this limited scope.
 */

const ADDON_NAME = PropertiesService.getScriptProperties().getProperty("ADDON_NAME");

/**
 * Creates a menu entry in the Google Docs UI when the document is opened.
 *
 * @param {object} e The event parameter for a simple onOpen trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode.
 */
function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
    .addItem('Start', 'showSidebar')
    .addToUi();
}

/**
 * Runs when the add-on is installed.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode. (In practice, onInstall triggers always
 *     run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 *     AuthMode.NONE.)
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 */
function showSidebar() {
  var ui = HtmlService.createHtmlOutputFromFile('sidebar')
    .setTitle(ADDON_NAME);
  DocumentApp.getUi().showSidebar(ui);
}

/**
 * Gets the stored user preferences for the grade, if it exist.
 *
 * @return {Object} The user's grade preferences, if it exist.
 */
function getPreferences() {
  var userProperties = PropertiesService.getUserProperties();

  return {
    grade: userProperties.getProperty('GRADE')
  };
}

/**
 * Sets the stored user preferences for the grade.
 * 
 * @param {number} grade Grade number.
 */
function setPreferences(grade) {
  var userProperties = PropertiesService.getUserProperties();

  userProperties.setProperty('GRADE', grade.toString());
}

/**
 * Replaces the text of the current selection with the provided text, or
 * inserts text at the current cursor location. (There will always be either
 * a selection or a cursor.) If multiple elements are selected, only inserts the
 * translated text in the first element that can contain text and removes the
 * other elements.
 *
 * @param {number} grade Grade number.
 * @return {Object} Object containing the kanji and grade.
 */
function nannenkanji(grade) {
  var bookmarks = [];
  var document = DocumentApp.getActiveDocument();
  var selection = document.getSelection();

  if (selection !== null) {
    var elements = selection.getRangeElements();

    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];
      var startOffset = element.getStartOffset();
      var endOffsetInclusive = element.getEndOffsetInclusive();

      if (element.getElement().editAsText) {
        var textElement = element.getElement().editAsText();

        for (var offset = startOffset; offset < endOffsetInclusive; offset++) {
          var position = document.newPosition(textElement, offset);
          var surroundingText = position.getSurroundingText().getText();
          var surroundingTextOffset = position.getSurroundingTextOffset();
          var text = surroundingText[surroundingTextOffset];
          var result = analyzeKanji(text);

          if (result[text] > grade) {
            var bookmark = {};

            bookmark[text] = offset;
            bookmarks.push(bookmark);
          }
        }
      }
    }
  } else {
    var body = document.getBody();
    var textElement = body.editAsText();
    var string = textElement.getText();

    for (var offset = 0; offset < string.length; offset++) {
      var position = document.newPosition(textElement, offset);
      var surroundingText = position.getSurroundingText().getText();
      var surroundingTextOffset = position.getSurroundingTextOffset();
      var text = surroundingText[surroundingTextOffset];
      var result = analyzeKanji(text);

      if (result[text] > grade) {
        var bookmark = {};

        bookmark[text] = offset;
        bookmarks.push(bookmark);
      }
    }
  }

  return bookmarks;
}

/**
 * Extract the kanji from the given text and associate it with the grade to learn.
 * The JSON format is a pair of Kanji and the grade level to learn it.
 *
 * @param {string} text Original text.
 * @return {object} The result of the JSON object.
 */
function analyzeKanji(text) {
  var json = {};

  if (text) {
    for (var i = 0; i < text.length; i++) {
      var c = text[i];

      if (isKanji(c)) {
        if (json[c] === undefined) {
          var grade = toGrade(c);

          json[c] = grade;
        }
      }
    }
  }

  return json;
}

/**
 * Select kanji in the Document.
 * 
 * @param {string} kanji kanji in Body object
 */
function jumpCursor(kanji) {
  var document = DocumentApp.getActiveDocument();
  var body = document.getBody();
  var rangeBuilder = document.newRange();
  var rangeElement = body.findText(kanji);
  var startOffset = rangeElement.getStartOffset();
  var endOffsetInclusive = rangeElement.getEndOffsetInclusive();

  rangeBuilder.addElement(rangeElement.getElement(), startOffset, endOffsetInclusive);
  document.setSelection(rangeBuilder.build());
}
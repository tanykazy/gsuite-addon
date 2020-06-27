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
 * Search for Kanji in Document and make a list. The list is filtered by the kanji learned.
 *
 * @param {number} grade Grade number.
 * @return {Array} Array containing Object kanji and grade.
 */
function nannenkanji(grade) {
  var bookmarks = [];
  var document = DocumentApp.getActiveDocument();
  var selection = document.getSelection();

  if (selection !== null) {
    var elements = selection.getRangeElements();

    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];

      if (element.getElement().editAsText) {
        var textElement = element.getElement().editAsText();
        var startOffset = element.getStartOffset();
        var endOffsetInclusive = element.getEndOffsetInclusive();

        bookmarks.unshift(...scanTextElement(textElement, startOffset, endOffsetInclusive + 1));
      }
    }
  } else {
    var body = document.getBody();
    var textElement = body.editAsText();
    var string = textElement.getText();

    bookmarks = scanTextElement(textElement, 0, string.length);
  }

  for (var i = 0; i < bookmarks.length; i++){
    if (bookmarks[i].grade < grade) {
      bookmarks.splice(i, 1);
    }  
  }

  return bookmarks;
}

/**
 * 
 * @param {Object} textElement 
 * @param {number} start 
 * @param {number} end 
 */
function scanTextElement(textElement, start, end) {
  var document = DocumentApp.getActiveDocument();
  var results = [];
  var hash = {};

  for (var offset = start; offset < end; offset++) {
    var position = document.newPosition(textElement, offset);
    var surroundingText = position.getSurroundingText().getText();
    var surroundingTextOffset = position.getSurroundingTextOffset();
    var text = surroundingText[surroundingTextOffset];

    if (isKanji(text)) {
      if (!hash[text]) {
        hash[text] = true;

        var grade = toGrade(text);

        results.unshift({
          kanji: text,
          position: offset,
          grade: grade
        });
      }
    }
  }

  return results;
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

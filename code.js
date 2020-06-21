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
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
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
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
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
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 */
function showSidebar() {
  var ui = HtmlService.createHtmlOutputFromFile('sidebar')
    .setTitle(ADDON_NAME);
  DocumentApp.getUi().showSidebar(ui);
}

/**
 * Gets the text the user has selected. If there is no selection,
 * this function displays an error message.
 *
 * @return {Array.<string>} The selected text.
 */
function getSelectedText() {
  var selection = DocumentApp.getActiveDocument().getSelection();
  var text = [];

  if (selection !== null) {
    var elements = selection.getRangeElements();

    for (var i = 0; i < elements.length; ++i) {
      if (elements[i].isPartial()) {
        var element = elements[i].getElement().asText();
        var startIndex = elements[i].getStartOffset();
        var endIndex = elements[i].getEndOffsetInclusive();

        text.push(element.getText().substring(startIndex, endIndex + 1));
      } else {
        var element = elements[i].getElement();

        // Only translate elements that can be edited as text; skip images and
        // other non-text elements.
        if (element.editAsText) {
          var elementText = element.asText().getText();

          // This check is necessary to exclude images, which return a blank
          // text element.
          if (elementText) {
            text.push(elementText);
          }
        }
      }
    }
  }

  if (!text.length) {
    throw new Error('Please select some text.');
  }

  return text;
}

/**
 * Gets the stored user preferences for the origin and destination languages,
 * if they exist.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @return {Object} The user's origin and destination language preferences, if
 *     they exist.
 */
function getPreferences() {
  var userProperties = PropertiesService.getUserProperties();

  return {
    grade: userProperties.getProperty('grade')
  };
}

/**
 * Gets the user-selected text and translates it from the origin language to the
 * destination language. The languages are notated by their two-letter short
 * form. For example, English is 'en', and Spanish is 'es'. The origin language
 * may be specified as an empty string to indicate that Google Translate should
 * auto-detect the language.
 *
 * @param {string} grade The two-letter short form for the origin language.
 * @param {boolean} savePrefs Whether to save the origin and destination
 *     language preferences.
 * @return {Object} Object containing the original text and the result of the
 *     translation.
 */
function getTextAndTranslation(grade, savePrefs) {
  if (savePrefs) {
    PropertiesService.getUserProperties()
      .setProperty('grade', grade);
  }

  var text = getSelectedText().join('\n');
  var json = analyzeKanji(text);

  for (c in json) {
    if (json[c] < grade) {
      delete json[c];
    }
  }

  var output = ContentService.createTextOutput(JSON.stringify(json))
    .setMimeType(ContentService.MimeType.JSON)
    .getContent();

  return {
    text: text,
    translation: output
  };
}

/**
 * Replaces the text of the current selection with the provided text, or
 * inserts text at the current cursor location. (There will always be either
 * a selection or a cursor.) If multiple elements are selected, only inserts the
 * translated text in the first element that can contain text and removes the
 * other elements.
 *
 * @param {string} newText The text with which to replace the current selection.
 */
function addComment(grade) {
  var document = DocumentApp.getActiveDocument();
  var body = document.getBody();
  var text = body.editAsText();
  var string = text.getText();
  var bookmarks = {};

  for (var offset = 0; offset < string.length; offset++) {
    var position = document.newPosition(text, offset);
    var surroundingText = position.getSurroundingText().getText();
    var surroundingTextOffset = position.getSurroundingTextOffset();

    var result = analyzeKanji(surroundingText[surroundingTextOffset]);

    if (result[surroundingText[surroundingTextOffset]] > grade) {
      // var bookmark = position.insertBookmark();
      // bookmarks[surroundingText[surroundingTextOffset]] = bookmark.getId();
      bookmarks[surroundingText[surroundingTextOffset]] = offset;
    }
  }

  return bookmarks;
}

/**
 * Given text, translate it from the origin language to the destination
 * language. The languages are notated by their two-letter short form. For
 * example, English is 'en', and Spanish is 'es'. The origin language may be
 * specified as an empty string to indicate that Google Translate should
 * auto-detect the language.
 *
 * @param {string} text text to translate.
 * @return {string} The result of the translation, or the original text if
 *     origin and dest languages are the same.
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

function jumpCursor(offset) {
  var document = DocumentApp.getActiveDocument();
  var body = document.getBody();
  var text = body.editAsText();
  var position = document.newPosition(text, offset);

  Logger.log(offset)

  document.setCursor(position);
}
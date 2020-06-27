# G Suite Add-ons Repository

## Requirement

[clasp](https://github.com/google/clasp/)

## Testing

To test this Add-on, please follow the steps as bellow.

```
# create a document file on your G Drive and connect it to the Google App Script Workspace
$ clasp create Kanji xxxxxGOOGLEーDOCS-IDxxxxxxxxxxx
? Create which script? docs
Created new Google Doc: https://drive.google.com/open?id=xxxxxGOOGLEーDOCS-IDxxxxxxxxxxx
Created new Google Docs Add-on script: https://script.google.com/d/1xxxxxGOOGLEーDOCS-IDxxxxxxxxxxx/edit
Warning: files in subfolder are not accounted for unless you set a '.claspignore' file.
Cloned 1 file.
└─ appsscript.json

# push fules to Google App Script Workspace
$ clasp push
└─ appsscript.json
└─ code.js
└─ kanji.js
└─ nannen.js
└─ sidebar.html
Pushed 5 files.

# open Google App Script Workspace
$ clasp open
Opening script: https://script.google.com/d/xxxxxGOOGLEーDOCS-IDxxxxxxxxxxx/edit

# deploy the codes on Google App Script Workspace so that you can use the addon on the document
$ clasp deploy
Created version 1.
- xxxxxGOOGLEーDOCS-IDxxxxxxxxxxx @1.

# Then you can test the addon from Menu bar.
```

Please refer to the following document to test your addon on G Suite: https://developers.google.com/gsuite/add-ons/how-tos/testing-editor-addons


##

[nannenkanji](./nannenkanji/)


## Author

tanykazy

## License

GPL v3

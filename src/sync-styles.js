// Pass an array and a property key, and get a new array
// containing just that property for each item
//
var getArrayOfValues = (array, key) => {
  let result = [];
  let length = array.count();

  for (let i = 0; i < length; i++) {
    result[i] = array[i][key]();
  }
  
  return result;
};

// Create a ComboBox from an array of values
//
var newSelect = (array, frame) => {
  frame = frame || [];
  x = frame[0] || 0;
  y = frame[1] || 0;
  w = frame[2] || 240;
  h = frame[3] || 28;

  let rect = NSMakeRect(x, y, w, h);
  let combo = NSComboBox.alloc().initWithFrame(rect);

  combo.addItemsWithObjectValues(array);
  combo.selectItemAtIndex(0);

  return combo;
};

// Launch popup to pick a library from a set of libraries.
// Returns the chosen library.
//
var pickLibrary = (libs) => {

  let libNames = getArrayOfValues(libs, 'name');

  let alert = COSAlertWindow.new();
  let select = newSelect(libNames);

  alert.addAccessoryView(select);
  alert.setMessageText('Choose a library to sync styles from...');
  alert.addButtonWithTitle("OK");
  alert.addButtonWithTitle("Cancel");

  alert.alert().window().setInitialFirstResponder(select);

  let response = alert.runModal();

  if (response === 1000) {
    return libs[select.indexOfSelectedItem()];
  }
  else {
    return -1;
  }
};

// From a set of styles, create an object with the style names as keys
//
var getStylesByName = (styles) => {
  let result = {};

  for (let i = 0; i < styles.numberOfSharedStyles(); i++) {
    let style = styles.objects().objectAtIndex(i);
    result[style.name()] = style;
  }

  return result;

};

// Copy layer and text styles from one document to another,
// updating any that already exist by the same name
//
var copyStylesFromDocument = (source, dest, context) => {

  let sourceData = source.documentData();
  let destData = dest.documentData();
  let newCount = 0;
  let updateCount = 0;
  
  for (let type of ['layerStyles', 'layerTextStyles']) {
    
    let sourceStyles = sourceData[type]();
    let sourceStylesByName = getStylesByName(sourceStyles);

    let destStyles = destData[type]();
    let destStylesByName = getStylesByName(destStyles);

    for (let name in sourceStylesByName) {
      if (destStylesByName[name]) {
        destStyles.updateValueOfSharedObject_byCopyingInstance(destStylesByName[name], sourceStylesByName[name].style());
        destStyles.synchroniseInstancesOfSharedObject_withInstance(destStylesByName[name], sourceStylesByName[name].style());
        updateCount++;
      }
      else {
        destStyles.addSharedStyleWithName_firstInstance(name, sourceStylesByName[name].style());
        newCount++;
      }
    }
  }

  let totalCount = newCount + updateCount;

  if (totalCount) {
    var message = '🤘 ' + totalCount + ' styles synced';
    if (newCount) message += ' (' + newCount + ' new)';
  }
  else {
    var message = 'No styles found in the selected library';
  }

  context.document.showMessage(message);
};

var syncStyles = (context) => {

  const userLibs = AppController.sharedInstance().librariesController().userLibraries();
  const lib = pickLibrary(userLibs);

  copyStylesFromDocument(lib.document(), context.document, context);

};

export default syncStyles
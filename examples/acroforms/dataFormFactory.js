(function(exports){

'use strict';

// returned to pdfDocument.fields once finished, opens up for external observers
var parsedFields = [],
	viewport;

function bindInputItem(input, item) {
  	if(pdfViewer.fieldStorage){
  		pdfViewer.fieldStorage(input, item);
  		return;
  	}

    if (input.name in pdfViewer.currentValues) {
      var value = pdfViewer.currentValues[input.name];
      if (input.type == 'checkbox')
        input.checked = value;
      else if (!input.type || input.type == 'text')
        input.value = value;
    }

    input.onchange = function pageViewSetupInputOnBlur() {
      if (input.type == 'checkbox')
        pdfViewer.currentValues[input.name] = input.checked;
      else if (!input.type || input.type == 'text')
        pdfViewer.currentValues[input.name] = input.value;
    };
  }

  function createElementWithStyle(tagName, item) {
    var element = document.createElement(tagName);
    var rect = PDFJS.Util.normalizeRect(
      viewport.convertToViewportRectangle(item.rect));
    element.style.left = Math.floor(rect[0]) + 'px';
    element.style.top = Math.floor(rect[1]) + 'px';
    element.style.width = Math.ceil(rect[2] - rect[0]) + 'px';
    element.style.height = Math.ceil(rect[3] - rect[1]) + 'px';
    return element;
  }

  function assignFontStyle(element, item) {
    var fontStyles = '';
    if ('fontSize' in item) {
      fontStyles += 'font-size: ' + Math.round(item.fontSize *
        viewport.fontScale) + 'px;';
    }
    switch (item.textAlignment) {
      case 0:
        fontStyles += 'text-align: left;';
        break;
      case 1:
        fontStyles += 'text-align: center;';
        break;
      case 2:
        fontStyles += 'text-align: right;';
        break;
    }
    element.setAttribute('style', element.getAttribute('style') + fontStyles);
  }


function resolveControl(pdfType) {
    switch (pdfType) {
        case "Btn": // && value === 'Off' || value === 'On'
            return "checkbox";
            break;
        case "Dt":
            return "date";
        case "Ch":
            return "list";
            break;
        default:
            return "text"
    }
};

function addField(field, viewport){
 	var tag = field.fullName.toUpperCase();
    var viewRect = PDFJS.Util.normalizeRect(viewport.convertToViewportRectangle(field.rect));
    var section = tag.indexOf('.') > -1 ? tag.split('.')[1] : null;
    // in dataFormView: by now we've been trough data binding setup:
    //	docField = fieldConfiguration.for(field.fullName);
    //  load dataSource as configured and display based on field.dataSource
    var docField = {
        "name": field.alternativeText,
        "tag": tag,   
        "controlType": resolveControl(field.fieldType), 
        "section": section, /* used for digital layout and config view */
        "position": {               
            left: Math.floor( viewRect[0] ),
            top: Math.floor( viewRect[1] ),
            width: Math.ceil( viewRect[2] - viewRect[0] ), 
            height: Math.ceil( viewRect[3] - viewRect[1] )
        },
        "dataSource" : {
        	binding: "query|oneWay|twoWay", /* select list | span | input field */
        	expression: "WorkPermitNumber|Isolation.IsolationNumber", /* relative to current entity */
        	dataType: "string|date|time|datetime|number|decinal|yes-no", /* how to format the value */
        	format: "" /*optional (advanced config)*/
        },
        "rules" : {

        }
    };

    parsedFields.push(docField);
}

function dataFormFactory(items, canvasViewport, div){

	viewport = canvasViewport;
	
	console.log('addon dataFormFactory activated');

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      switch (item.subtype) {
        case 'Widget':
          if (item.fieldType != 'Tx' && item.fieldType != 'Btn' &&
              item.fieldType != 'Ch')
            break;
          var inputDiv = createElementWithStyle('div', item);
          inputDiv.className = 'inputHint';
          div.appendChild(inputDiv);
          var input;

          // TODOs apply for the external mixin, not this default behaviour

          // TODO: Add support for barcode and image somehow

            //TODO: scale fonts to viewport scale
          if (item.fieldType == 'Tx') {
          	// if data-bound, use span and display-as property. Can be date, time, etc
            input = createElementWithStyle('input', item);
          }
          if (item.fieldType == 'Btn') {
            input = createElementWithStyle('input', item);
            if (item.flags & 32768) {
              input.type = 'radio';
               // radio button is not supported
            } else if (item.flags & 65536) {
              input.type = 'button';
              // pushbutton is not supported
            } else {
              input.type = 'checkbox';
            }
          }
          if (item.fieldType == 'Ch') {          	
            input = createElementWithStyle('select', item);
            // select box is not supported
          }
          input.className = 'inputControl';
          input.name = item.fullName;
          input.title = item.alternativeText;
          assignFontStyle(input, item);
          bindInputItem(input, item);
          div.appendChild(input);

          addField(item,viewport);

          break;
      }
    }
    return parsedFields;
}

exports.addons = exports.addons || {}; // hack, remove the addons stuff

exports.addons.dataFormFactory = dataFormFactory;

})(window.pdfViewer);
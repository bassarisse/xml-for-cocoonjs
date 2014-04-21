XML for CocoonJS
================

Version 0.8.6 (beta)

Combining a substantial re-write of [xmldoc](https://github.com/nfarina/xmldoc) and the [sax.js](https://github.com/isaacs/sax-js) Node.js modules, this serves to re-create the DOMParser object in user agents (like CocoonJS) that do not have native XML parsing. It also adds support for most DOM Core Level 1 XML operations.

Currently, this parses text strings into a document-like tree object with the root element of the XML as a "XmlDocument" object and all of its elements, and their own children, as "XmlElement" or similar objects. All common functions like getElementsByTagName, firstChild, and childNodes work as they would normally. However, in addition to the noted differences from the [specification](http://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html) below, attributes do not hold Text nodes and are objects per node with properties as key-value pairs instead. (Attribute mutators like get/set work as they normally would, but edit the object instead of Text nodes.)

##DOM Core Level 1 differences:
* All nodes, including XmlDocument, XmlElement, Attr, Text, Comment, CDATA, ProcessingInstruction, DOMImplementation, and DocumentFragment, 
are JavaScript OBJECTS, not their corresponding object names in the specification. Those functions which would normally return NodeLists are mapped to arrays instead. (Obviously, the arrays are not "live" either then.)
* DOMException doesn't exist, but its error codes do in the different functionality where they would have been thrown normally.
* DOMImplementation exists, but hasFeature() always returns "true" and createDocument() returns an empty XmlDocument object.
* It doesn't understand docTypes at all. Thus, DOCUMENT_TYPE_NODE is not a possible nodeType value. Nor does document.createDocumentType() exist.
* EntityReference doesn't exist, nor does document.createEntryReference() as a result. ENTITY_REFERENCE_NODE and ENTITY_NODE aren't valid nodeTypes.
* Notation doesn't exist; NOTATION_NODE is not a valid nodeType.
* Readonly access is only enforced on "nodeName" and "nodeValue" properties of nodes.
* HIERARCHY_REQUEST_ERR will never occur.
* Will never throw "NO_MODIFICATION_ALLOWED_ERR," as all nodes can be edited at any time.
* appendChild(node) does not currently work with DocumentFragment nodes. Will not load DocumentFragment's children into the tree correctly.
* insertBefore(), removeChild(), replaceChild(), and cloneNode() are not currently implemented.
* Text nodes do not have the splitText() function (as this depends on insertBefore())

##TODO
* Implement check for DocumentFragment nodes in appendChild, add its children to tree
* Implement insertBefore(), removeChild(), replaceChild(), and cloneNode()
* Add splitText() to Text nodes
* Support DOM Core Level 2
* Support namespace-related operations

## Basic Example

```javascript
 window['DOMParser'] = domParser; //Assuming not isCocoonJS
 var xmlhttp = new XMLHttpRequest();
     xmlhttp.open("GET", "example.xml", true);
     xmlhttp.onreadystatechange = handler;
     xmlhttp.send();

     function handler()
     {
       if (xmlhttp.readyState === 4) {
         if (xmlhttp.status === 200) {
           var tmp = new DOMParser();
           var xml = tmp.parseFromString(xmlhttp.responseText, "text/xml");
         }
       }
     }
```

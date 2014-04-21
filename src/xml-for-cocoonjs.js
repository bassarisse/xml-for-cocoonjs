/*
 * XML for CocoonJS
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Dan Cox
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/*
 * sax.js
 * https://github.com/isaacs/sax-js
 * 
 * Copyright (c) Isaac Z. Schlueter ("Author")
 * All rights reserved.
 * 
 * The BSD License
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 
 * 1. Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 * 
 * 2. Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR
 * BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN
 * IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * "String.fromCodePoint" used under the terms of the MIT license. Its license
 * follows:
 *
 * Copyright Mathias Bynens <http://mathiasbynens.be/>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/*
 * xmldoc
 * https://github.com/nfarina/xmldoc
 * 
 * Copyright 2012 Nick Farina.
 * All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

!function(root, factory) {
  if (typeof define === "function" && define.amd) {
    define(factory);
  } else if (typeof exports === "object") {
    module.exports = factory();
  } else {
    root.domParser = factory();
  }
}(this, function() {

  /**
   * @author       Dan Cox <dan.cox@videlais.com>
   * @copyright    2014 Dan Cox
   * @license      {@link https://github.com/videlais/xml-for-cocoonjs/blob/master/license.txt|MIT License}
   */
  /**
   * @overview
   *
   * v0.8.6
   *
   * By Dan Cox http://www.videlais.com @videlais
   *
   * A drop-in replacement for DOMParser for CocoonJS by Dan Cox (@videlais).
   *
   */

  /**
   * @namespace domParser
   */
  var domParser = function domParser() {

    /**
     * A function enclosure of the sax.js library
     * @class SAX
     */
    var SAX = (function() {

      /**
       * The exported object containing references to sax's internal functions
       * @class sax
       */
      var sax = function() {
      };
      /** 
       * Returns a new SAXParser object
       * @method sax.parser
       * @param {boolean} strict If the parser should be strict (and throw errors) or not
       * @param {object}  opt An object holding the options for the parser
       * @public
       */
      sax.parser = function(strict, opt) {
        return new SAXParser(strict, opt);
      };
      sax.SAXParser = SAXParser;
      sax.SAXStream = SAXStream;
      sax.createStream = createStream;

      sax.MAX_BUFFER_LENGTH = 64 * 1024;

      var buffers = [
        "comment", "sgmlDecl", "textNode", "tagName", "doctype",
        "procInstName", "procInstBody", "entity", "attribName",
        "attribValue", "cdata", "script"
      ];

      sax.EVENTS = // for discoverability.
              ["text"
                        , "processinginstruction"
                        , "sgmldeclaration"
                        , "doctype"
                        , "comment"
                        , "attribute"
                        , "opentag"
                        , "closetag"
                        , "opencdata"
                        , "cdata"
                        , "closecdata"
                        , "error"
                        , "end"
                        , "ready"
                        , "script"
                        , "opennamespace"
                        , "closenamespace"
              ];

      function SAXParser(strict, opt) {
        if (!(this instanceof SAXParser))
          return new SAXParser(strict, opt);

        var parser = this;
        clearBuffers(parser);
        parser.q = parser.c = "";
        parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH;
        parser.opt = opt || {};
        parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags;
        parser.looseCase = parser.opt.lowercase ? "toLowerCase" : "toUpperCase";
        parser.tags = [];
        parser.closed = parser.closedRoot = parser.sawRoot = false;
        parser.tag = parser.error = null;
        parser.strict = !!strict;
        parser.noscript = !!(strict || parser.opt.noscript);
        parser.state = S.BEGIN;
        parser.ENTITIES = Object.create(sax.ENTITIES);
        parser.attribList = [];

        // namespaces form a prototype chain.
        // it always points at the current tag,
        // which protos to its parent tag.
        if (parser.opt.xmlns)
          parser.ns = Object.create(rootNS);

        // mostly just for error reporting
        parser.trackPosition = parser.opt.position !== false;
        if (parser.trackPosition) {
          parser.position = parser.line = parser.column = 0;
        }
        emit(parser, "onready");
      }

      if (!Object.create)
        Object.create = function(o) {
          function f() {
            this.__proto__ = o;
          }
          f.prototype = o;
          return new f;
        };

      if (!Object.getPrototypeOf)
        Object.getPrototypeOf = function(o) {
          return o.__proto__;
        };

      if (!Object.keys)
        Object.keys = function(o) {
          var a = [];
          for (var i in o)
            if (o.hasOwnProperty(i))
              a.push(i);
          return a;
        };

      function checkBufferLength(parser) {
        var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10)
                , maxActual = 0;
        for (var i = 0, l = buffers.length; i < l; i++) {
          var len = parser[buffers[i]].length;
          if (len > maxAllowed) {
            // Text/cdata nodes can get big, and since they're buffered,
            // we can get here under normal conditions.
            // Avoid issues by emitting the text node now,
            // so at least it won't get any bigger.
            switch (buffers[i]) {
              case "textNode":
                closeText(parser);
                break

              case "cdata":
                emitNode(parser, "oncdata", parser.cdata);
                parser.cdata = "";
                break

              case "script":
                emitNode(parser, "onscript", parser.script);
                parser.script = "";
                break

              default:
                error(parser, "Max buffer length exceeded: " + buffers[i]);
            }
          }
          maxActual = Math.max(maxActual, len);
        }
        // schedule the next check for the earliest possible buffer overrun.
        parser.bufferCheckPosition = (sax.MAX_BUFFER_LENGTH - maxActual)
                + parser.position;
      }

      function clearBuffers(parser) {
        for (var i = 0, l = buffers.length; i < l; i++) {
          parser[buffers[i]] = "";
        }
      }

      function flushBuffers(parser) {
        closeText(parser);
        if (parser.cdata !== "") {
          emitNode(parser, "oncdata", parser.cdata);
          parser.cdata = "";
        }
        if (parser.script !== "") {
          emitNode(parser, "onscript", parser.script);
          parser.script = "";
        }
      }

      SAXParser.prototype =
              {end: function() {
                  end(this);
                }
                , write: write
                , resume: function() {
                  this.error = null;
                  return this;
                }
                , close: function() {
                  return this.write(null);
                }
                , flush: function() {
                  flushBuffers(this);
                }
              };

      try {
        var Stream = require("stream").Stream;
      } catch (ex) {
        var Stream = function() {
        };
      }


      var streamWraps = sax.EVENTS.filter(function(ev) {
        return ev !== "error" && ev !== "end";
      });

      function createStream(strict, opt) {
        return new SAXStream(strict, opt);
      }

      function SAXStream(strict, opt) {
        if (!(this instanceof SAXStream))
          return new SAXStream(strict, opt);

        Stream.apply(this);

        this._parser = new SAXParser(strict, opt);
        this.writable = true;
        this.readable = true;


        var me = this;

        this._parser.onend = function() {
          me.emit("end");
        };

        this._parser.onerror = function(er) {
          me.emit("error", er);

          // if didn't throw, then means error was handled.
          // go ahead and clear error, so we can write again.
          me._parser.error = null;
        };

        this._decoder = null;

        streamWraps.forEach(function(ev) {
          Object.defineProperty(me, "on" + ev, {
            get: function() {
              return me._parser["on" + ev];
            },
            set: function(h) {
              if (!h) {
                me.removeAllListeners(ev);
                return me._parser["on" + ev] = h;
              }
              me.on(ev, h);
            },
            enumerable: true,
            configurable: false
          });
        });
      }

      SAXStream.prototype = Object.create(Stream.prototype,
              {constructor: {value: SAXStream}});

      SAXStream.prototype.write = function(data) {
        if (typeof Buffer === 'function' &&
                typeof Buffer.isBuffer === 'function' &&
                Buffer.isBuffer(data)) {
          if (!this._decoder) {
            var SD = require('string_decoder').StringDecoder;
            this._decoder = new SD('utf8');
          }
          data = this._decoder.write(data);
        }

        this._parser.write(data.toString());
        this.emit("data", data);
        return true;
      };

      SAXStream.prototype.end = function(chunk) {
        if (chunk && chunk.length)
          this.write(chunk);
        this._parser.end();
        return true;
      };

      SAXStream.prototype.on = function(ev, handler) {
        var me = this;
        if (!me._parser["on" + ev] && streamWraps.indexOf(ev) !== -1) {
          me._parser["on" + ev] = function() {
            var args = arguments.length === 1 ? [arguments[0]]
                    : Array.apply(null, arguments);
            args.splice(0, 0, ev);
            me.emit.apply(me, args);
          };
        }

        return Stream.prototype.on.call(me, ev, handler);
      };



// character classes and tokens
      var whitespace = "\r\n\t "
              // this really needs to be replaced with character classes.
              // XML allows all manner of ridiculous numbers and digits.
              , number = "0124356789"
              , letter = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
              // (Letter | "_" | ":")
              , quote = "'\""
              , entity = number + letter + "#"
              , attribEnd = whitespace + ">"
              , CDATA = "[CDATA["
              , DOCTYPE = "DOCTYPE"
              , XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace"
              , XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/"
              , rootNS = {xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE};

// turn all the string character sets into character class objects.
      whitespace = charClass(whitespace);
      number = charClass(number);
      letter = charClass(letter);

// http://www.w3.org/TR/REC-xml/#NT-NameStartChar
// This implementation works on strings, a single character at a time
// as such, it cannot ever support astral-plane characters (10000-EFFFF)
// without a significant breaking change to either this  parser, or the
// JavaScript language.  Implementation of an emoji-capable xml parser
// is left as an exercise for the reader.
      var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;

      var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040\.\d-]/;

      quote = charClass(quote);
      entity = charClass(entity);
      attribEnd = charClass(attribEnd);

      function charClass(str) {
        return str.split("").reduce(function(s, c) {
          s[c] = true;
          return s;
        }, {});
      }

      function isRegExp(c) {
        return Object.prototype.toString.call(c) === '[object RegExp]';
      }

      function is(charclass, c) {
        return isRegExp(charclass) ? !!c.match(charclass) : charclass[c];
      }

      function not(charclass, c) {
        return !is(charclass, c);
      }

      var S = 0;
      sax.STATE =
              {BEGIN: S++
                , TEXT: S++ // general stuff
                , TEXT_ENTITY: S++ // &amp and such.
                , OPEN_WAKA: S++ // <
                , SGML_DECL: S++ // <!BLARG
                , SGML_DECL_QUOTED: S++ // <!BLARG foo "bar
                , DOCTYPE: S++ // <!DOCTYPE
                , DOCTYPE_QUOTED: S++ // <!DOCTYPE "//blah
                , DOCTYPE_DTD: S++ // <!DOCTYPE "//blah" [ ...
                , DOCTYPE_DTD_QUOTED: S++ // <!DOCTYPE "//blah" [ "foo
                , COMMENT_STARTING: S++ // <!-
                , COMMENT: S++ // <!--
                , COMMENT_ENDING: S++ // <!-- blah -
                , COMMENT_ENDED: S++ // <!-- blah --
                , CDATA: S++ // <![CDATA[ something
                , CDATA_ENDING: S++ // ]
                , CDATA_ENDING_2: S++ // ]]
                , PROC_INST: S++ // <?hi
                , PROC_INST_BODY: S++ // <?hi there
                , PROC_INST_ENDING: S++ // <?hi "there" ?
                , OPEN_TAG: S++ // <strong
                , OPEN_TAG_SLASH: S++ // <strong /
                , ATTRIB: S++ // <a
                , ATTRIB_NAME: S++ // <a foo
                , ATTRIB_NAME_SAW_WHITE: S++ // <a foo _
                , ATTRIB_VALUE: S++ // <a foo=
                , ATTRIB_VALUE_QUOTED: S++ // <a foo="bar
                , ATTRIB_VALUE_CLOSED: S++ // <a foo="bar"
                , ATTRIB_VALUE_UNQUOTED: S++ // <a foo=bar
                , ATTRIB_VALUE_ENTITY_Q: S++ // <foo bar="&quot;"
                , ATTRIB_VALUE_ENTITY_U: S++ // <foo bar=&quot;
                , CLOSE_TAG: S++ // </a
                , CLOSE_TAG_SAW_WHITE: S++ // </a   >
                , SCRIPT: S++ // <script> ...
                , SCRIPT_ENDING: S++ // <script> ... <
              };

      sax.ENTITIES =
              {"amp": "&"
                , "gt": ">"
                , "lt": "<"
                , "quot": "\""
                , "apos": "'"
                , "AElig": 198
                , "Aacute": 193
                , "Acirc": 194
                , "Agrave": 192
                , "Aring": 197
                , "Atilde": 195
                , "Auml": 196
                , "Ccedil": 199
                , "ETH": 208
                , "Eacute": 201
                , "Ecirc": 202
                , "Egrave": 200
                , "Euml": 203
                , "Iacute": 205
                , "Icirc": 206
                , "Igrave": 204
                , "Iuml": 207
                , "Ntilde": 209
                , "Oacute": 211
                , "Ocirc": 212
                , "Ograve": 210
                , "Oslash": 216
                , "Otilde": 213
                , "Ouml": 214
                , "THORN": 222
                , "Uacute": 218
                , "Ucirc": 219
                , "Ugrave": 217
                , "Uuml": 220
                , "Yacute": 221
                , "aacute": 225
                , "acirc": 226
                , "aelig": 230
                , "agrave": 224
                , "aring": 229
                , "atilde": 227
                , "auml": 228
                , "ccedil": 231
                , "eacute": 233
                , "ecirc": 234
                , "egrave": 232
                , "eth": 240
                , "euml": 235
                , "iacute": 237
                , "icirc": 238
                , "igrave": 236
                , "iuml": 239
                , "ntilde": 241
                , "oacute": 243
                , "ocirc": 244
                , "ograve": 242
                , "oslash": 248
                , "otilde": 245
                , "ouml": 246
                , "szlig": 223
                , "thorn": 254
                , "uacute": 250
                , "ucirc": 251
                , "ugrave": 249
                , "uuml": 252
                , "yacute": 253
                , "yuml": 255
                , "copy": 169
                , "reg": 174
                , "nbsp": 160
                , "iexcl": 161
                , "cent": 162
                , "pound": 163
                , "curren": 164
                , "yen": 165
                , "brvbar": 166
                , "sect": 167
                , "uml": 168
                , "ordf": 170
                , "laquo": 171
                , "not": 172
                , "shy": 173
                , "macr": 175
                , "deg": 176
                , "plusmn": 177
                , "sup1": 185
                , "sup2": 178
                , "sup3": 179
                , "acute": 180
                , "micro": 181
                , "para": 182
                , "middot": 183
                , "cedil": 184
                , "ordm": 186
                , "raquo": 187
                , "frac14": 188
                , "frac12": 189
                , "frac34": 190
                , "iquest": 191
                , "times": 215
                , "divide": 247
                , "OElig": 338
                , "oelig": 339
                , "Scaron": 352
                , "scaron": 353
                , "Yuml": 376
                , "fnof": 402
                , "circ": 710
                , "tilde": 732
                , "Alpha": 913
                , "Beta": 914
                , "Gamma": 915
                , "Delta": 916
                , "Epsilon": 917
                , "Zeta": 918
                , "Eta": 919
                , "Theta": 920
                , "Iota": 921
                , "Kappa": 922
                , "Lambda": 923
                , "Mu": 924
                , "Nu": 925
                , "Xi": 926
                , "Omicron": 927
                , "Pi": 928
                , "Rho": 929
                , "Sigma": 931
                , "Tau": 932
                , "Upsilon": 933
                , "Phi": 934
                , "Chi": 935
                , "Psi": 936
                , "Omega": 937
                , "alpha": 945
                , "beta": 946
                , "gamma": 947
                , "delta": 948
                , "epsilon": 949
                , "zeta": 950
                , "eta": 951
                , "theta": 952
                , "iota": 953
                , "kappa": 954
                , "lambda": 955
                , "mu": 956
                , "nu": 957
                , "xi": 958
                , "omicron": 959
                , "pi": 960
                , "rho": 961
                , "sigmaf": 962
                , "sigma": 963
                , "tau": 964
                , "upsilon": 965
                , "phi": 966
                , "chi": 967
                , "psi": 968
                , "omega": 969
                , "thetasym": 977
                , "upsih": 978
                , "piv": 982
                , "ensp": 8194
                , "emsp": 8195
                , "thinsp": 8201
                , "zwnj": 8204
                , "zwj": 8205
                , "lrm": 8206
                , "rlm": 8207
                , "ndash": 8211
                , "mdash": 8212
                , "lsquo": 8216
                , "rsquo": 8217
                , "sbquo": 8218
                , "ldquo": 8220
                , "rdquo": 8221
                , "bdquo": 8222
                , "dagger": 8224
                , "Dagger": 8225
                , "bull": 8226
                , "hellip": 8230
                , "permil": 8240
                , "prime": 8242
                , "Prime": 8243
                , "lsaquo": 8249
                , "rsaquo": 8250
                , "oline": 8254
                , "frasl": 8260
                , "euro": 8364
                , "image": 8465
                , "weierp": 8472
                , "real": 8476
                , "trade": 8482
                , "alefsym": 8501
                , "larr": 8592
                , "uarr": 8593
                , "rarr": 8594
                , "darr": 8595
                , "harr": 8596
                , "crarr": 8629
                , "lArr": 8656
                , "uArr": 8657
                , "rArr": 8658
                , "dArr": 8659
                , "hArr": 8660
                , "forall": 8704
                , "part": 8706
                , "exist": 8707
                , "empty": 8709
                , "nabla": 8711
                , "isin": 8712
                , "notin": 8713
                , "ni": 8715
                , "prod": 8719
                , "sum": 8721
                , "minus": 8722
                , "lowast": 8727
                , "radic": 8730
                , "prop": 8733
                , "infin": 8734
                , "ang": 8736
                , "and": 8743
                , "or": 8744
                , "cap": 8745
                , "cup": 8746
                , "int": 8747
                , "there4": 8756
                , "sim": 8764
                , "cong": 8773
                , "asymp": 8776
                , "ne": 8800
                , "equiv": 8801
                , "le": 8804
                , "ge": 8805
                , "sub": 8834
                , "sup": 8835
                , "nsub": 8836
                , "sube": 8838
                , "supe": 8839
                , "oplus": 8853
                , "otimes": 8855
                , "perp": 8869
                , "sdot": 8901
                , "lceil": 8968
                , "rceil": 8969
                , "lfloor": 8970
                , "rfloor": 8971
                , "lang": 9001
                , "rang": 9002
                , "loz": 9674
                , "spades": 9824
                , "clubs": 9827
                , "hearts": 9829
                , "diams": 9830
              };

      Object.keys(sax.ENTITIES).forEach(function(key) {
        var e = sax.ENTITIES[key];
        var s = typeof e === 'number' ? String.fromCharCode(e) : e;
        sax.ENTITIES[key] = s;
      });

      for (var S in sax.STATE)
      {
        sax.STATE[sax.STATE[S]] = S;
      }

      S = sax.STATE;

      function emit(parser, event, data) {
        parser[event] && parser[event](data);
      }

      function emitNode(parser, nodeType, data) {
        if (parser.textNode)
          closeText(parser);
        emit(parser, nodeType, data);
      }

      function closeText(parser) {
        parser.textNode = textopts(parser.opt, parser.textNode);
        if (parser.textNode)
          emit(parser, "ontext", parser.textNode);
        parser.textNode = "";
      }

      function textopts(opt, text) {
        if (opt.trim)
          text = text.trim();
        if (opt.normalize)
          text = text.replace(/\s+/g, " ");
        return text;
      }

      function error(parser, er) {
        closeText(parser);
        if (parser.trackPosition) {
          er += "\nLine: " + parser.line +
                  "\nColumn: " + parser.column +
                  "\nChar: " + parser.c;
        }
        er = new Error(er);
        parser.error = er;
        emit(parser, "onerror", er);
        return parser;
      }

      function end(parser) {
        if (!parser.closedRoot)
          strictFail(parser, "Unclosed root tag");
        if ((parser.state !== S.BEGIN) && (parser.state !== S.TEXT))
          error(parser, "Unexpected end");
        closeText(parser);
        parser.c = "";
        parser.closed = true;
        emit(parser, "onend");
        SAXParser.call(parser, parser.strict, parser.opt);
        return parser;
      }

      function strictFail(parser, message) {
        if (typeof parser !== 'object' || !(parser instanceof SAXParser))
          throw new Error('bad call to strictFail');
        if (parser.strict)
          error(parser, message);
      }

      function newTag(parser) {
        if (!parser.strict)
          parser.tagName = parser.tagName[parser.looseCase]();
        var parent = parser.tags[parser.tags.length - 1] || parser
                , tag = parser.tag = {name: parser.tagName, attributes: {}};

        // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
        if (parser.opt.xmlns)
          tag.ns = parent.ns;
        parser.attribList.length = 0;
      }

      function qname(name, attribute) {
        var i = name.indexOf(":")
                , qualName = i < 0 ? ["", name] : name.split(":")
                , prefix = qualName[0]
                , local = qualName[1];

        // <x "xmlns"="http://foo">
        if (attribute && name === "xmlns") {
          prefix = "xmlns";
          local = "";
        }

        return {prefix: prefix, local: local};
      }

      function attrib(parser) {
        if (!parser.strict)
          parser.attribName = parser.attribName[parser.looseCase]();

        if (parser.attribList.indexOf(parser.attribName) !== -1 ||
                parser.tag.attributes.hasOwnProperty(parser.attribName)) {
          return parser.attribName = parser.attribValue = "";
        }

        if (parser.opt.xmlns) {
          var qn = qname(parser.attribName, true)
                  , prefix = qn.prefix
                  , local = qn.local;

          if (prefix === "xmlns") {
            // namespace binding attribute; push the binding into scope
            if (local === "xml" && parser.attribValue !== XML_NAMESPACE) {
              strictFail(parser
                      , "xml: prefix must be bound to " + XML_NAMESPACE + "\n"
                      + "Actual: " + parser.attribValue);
            } else if (local === "xmlns" && parser.attribValue !== XMLNS_NAMESPACE) {
              strictFail(parser
                      , "xmlns: prefix must be bound to " + XMLNS_NAMESPACE + "\n"
                      + "Actual: " + parser.attribValue);
            } else {
              var tag = parser.tag
                      , parent = parser.tags[parser.tags.length - 1] || parser;
              if (tag.ns === parent.ns) {
                tag.ns = Object.create(parent.ns);
              }
              tag.ns[local] = parser.attribValue;
            }
          }

          // defer onattribute events until all attributes have been seen
          // so any new bindings can take effect; preserve attribute order
          // so deferred events can be emitted in document order
          parser.attribList.push([parser.attribName, parser.attribValue]);
        } else {
          // in non-xmlns mode, we can emit the event right away
          parser.tag.attributes[parser.attribName] = parser.attribValue;
          emitNode(parser
                  , "onattribute"
                  , {name: parser.attribName
                    , value: parser.attribValue});
        }

        parser.attribName = parser.attribValue = "";
      }

      function openTag(parser, selfClosing) {
        if (parser.opt.xmlns) {
          // emit namespace binding events
          var tag = parser.tag;

          // add namespace info to tag
          var qn = qname(parser.tagName);
          tag.prefix = qn.prefix;
          tag.local = qn.local;
          tag.uri = tag.ns[qn.prefix] || "";

          if (tag.prefix && !tag.uri) {
            strictFail(parser, "Unbound namespace prefix: "
                    + JSON.stringify(parser.tagName));
            tag.uri = qn.prefix;
          }

          var parent = parser.tags[parser.tags.length - 1] || parser;
          if (tag.ns && parent.ns !== tag.ns) {
            Object.keys(tag.ns).forEach(function(p) {
              emitNode(parser
                      , "onopennamespace"
                      , {prefix: p, uri: tag.ns[p]});
            });
          }

          // handle deferred onattribute events
          // Note: do not apply default ns to attributes:
          //   http://www.w3.org/TR/REC-xml-names/#defaulting
          for (var i = 0, l = parser.attribList.length; i < l; i++) {
            var nv = parser.attribList[i];
            var name = nv[0]
                    , value = nv[1]
                    , qualName = qname(name, true)
                    , prefix = qualName.prefix
                    , local = qualName.local
                    , uri = prefix === "" ? "" : (tag.ns[prefix] || "")
                    , a = {name: name
                      , value: value
                      , prefix: prefix
                      , local: local
                      , uri: uri
                    };

            // if there's any attributes with an undefined namespace,
            // then fail on them now.
            if (prefix && prefix !== "xmlns" && !uri) {
              strictFail(parser, "Unbound namespace prefix: "
                      + JSON.stringify(prefix));
              a.uri = prefix;
            }
            parser.tag.attributes[name] = a;
            emitNode(parser, "onattribute", a);
          }
          parser.attribList.length = 0;
        }

        parser.tag.isSelfClosing = !!selfClosing;

        // process the tag
        parser.sawRoot = true;
        parser.tags.push(parser.tag);
        emitNode(parser, "onopentag", parser.tag);
        if (!selfClosing) {
          // special case for <script> in non-strict mode.
          if (!parser.noscript && parser.tagName.toLowerCase() === "script") {
            parser.state = S.SCRIPT;
          } else {
            parser.state = S.TEXT;
          }
          parser.tag = null;
          parser.tagName = "";
        }
        parser.attribName = parser.attribValue = "";
        parser.attribList.length = 0;
      }

      function closeTag(parser) {
        if (!parser.tagName) {
          strictFail(parser, "Weird empty close tag.");
          parser.textNode += "</>";
          parser.state = S.TEXT;
          return;
        }

        if (parser.script) {
          if (parser.tagName !== "script") {
            parser.script += "</" + parser.tagName + ">";
            parser.tagName = "";
            parser.state = S.SCRIPT;
            return;
          }
          emitNode(parser, "onscript", parser.script);
          parser.script = "";
        }

        // first make sure that the closing tag actually exists.
        // <a><b></c></b></a> will close everything, otherwise.
        var t = parser.tags.length;
        var tagName = parser.tagName;
        if (!parser.strict)
          tagName = tagName[parser.looseCase]();
        var closeTo = tagName;
        while (t--) {
          var close = parser.tags[t];
          if (close.name !== closeTo) {
            // fail the first time in strict mode
            strictFail(parser, "Unexpected close tag");
          } else
            break
        }

        // didn't find it.  we already failed for strict, so just abort.
        if (t < 0) {
          strictFail(parser, "Unmatched closing tag: " + parser.tagName);
          parser.textNode += "</" + parser.tagName + ">";
          parser.state = S.TEXT;
          return;
        }
        parser.tagName = tagName;
        var s = parser.tags.length;
        while (s-- > t) {
          var tag = parser.tag = parser.tags.pop();
          parser.tagName = parser.tag.name;
          emitNode(parser, "onclosetag", parser.tagName);

          var x = {};
          for (var i in tag.ns)
            x[i] = tag.ns[i];

          var parent = parser.tags[parser.tags.length - 1] || parser;
          if (parser.opt.xmlns && tag.ns !== parent.ns) {
            // remove namespace bindings introduced by tag
            Object.keys(tag.ns).forEach(function(p) {
              var n = tag.ns[p];
              emitNode(parser, "onclosenamespace", {prefix: p, uri: n});
            });
          }
        }
        if (t === 0)
          parser.closedRoot = true;
        parser.tagName = parser.attribValue = parser.attribName = "";
        parser.attribList.length = 0;
        parser.state = S.TEXT;
      }

      function parseEntity(parser) {
        var entity = parser.entity
                , entityLC = entity.toLowerCase()
                , num
                , numStr = "";
        if (parser.ENTITIES[entity])
          return parser.ENTITIES[entity];
        if (parser.ENTITIES[entityLC])
          return parser.ENTITIES[entityLC];
        entity = entityLC;
        if (entity.charAt(0) === "#") {
          if (entity.charAt(1) === "x") {
            entity = entity.slice(2);
            num = parseInt(entity, 16);
            numStr = num.toString(16);
          } else {
            entity = entity.slice(1);
            num = parseInt(entity, 10);
            numStr = num.toString(10);
          }
        }
        entity = entity.replace(/^0+/, "");
        if (numStr.toLowerCase() !== entity) {
          strictFail(parser, "Invalid character entity");
          return "&" + parser.entity + ";";
        }

        return String.fromCodePoint(num);
      }

      function write(chunk) {
        var parser = this;
        if (this.error)
          throw this.error
        if (parser.closed)
          return error(parser,
                  "Cannot write after close. Assign an onready handler.");
        if (chunk === null)
          return end(parser);
        var i = 0, c = "";
        while (parser.c = c = chunk.charAt(i++)) {
          if (parser.trackPosition) {
            parser.position++;
            if (c === "\n") {
              parser.line++;
              parser.column = 0;
            } else
              parser.column++;
          }
          switch (parser.state) {

            case S.BEGIN:
              if (c === "<") {
                parser.state = S.OPEN_WAKA;
                parser.startTagPosition = parser.position;
              } else if (not(whitespace, c)) {
                // have to process this as a text node.
                // weird, but happens.
                strictFail(parser, "Non-whitespace before first tag.");
                parser.textNode = c;
                parser.state = S.TEXT;
              }
              continue

            case S.TEXT:
              if (parser.sawRoot && !parser.closedRoot) {
                var starti = i - 1;
                while (c && c !== "<" && c !== "&") {
                  c = chunk.charAt(i++);
                  if (c && parser.trackPosition) {
                    parser.position++;
                    if (c === "\n") {
                      parser.line++;
                      parser.column = 0;
                    } else
                      parser.column++;
                  }
                }
                parser.textNode += chunk.substring(starti, i - 1);
              }
              if (c === "<") {
                parser.state = S.OPEN_WAKA;
                parser.startTagPosition = parser.position;
              } else {
                if (not(whitespace, c) && (!parser.sawRoot || parser.closedRoot))
                  strictFail(parser, "Text data outside of root node.");
                if (c === "&")
                  parser.state = S.TEXT_ENTITY;
                else
                  parser.textNode += c;
              }
              continue

            case S.SCRIPT:
              // only non-strict
              if (c === "<") {
                parser.state = S.SCRIPT_ENDING;
              } else
                parser.script += c;
              continue

            case S.SCRIPT_ENDING:
              if (c === "/") {
                parser.state = S.CLOSE_TAG;
              } else {
                parser.script += "<" + c;
                parser.state = S.SCRIPT;
              }
              continue

            case S.OPEN_WAKA:
              // either a /, ?, !, or text is coming next.
              if (c === "!") {
                parser.state = S.SGML_DECL;
                parser.sgmlDecl = "";
              } else if (is(whitespace, c)) {
                // wait for it...
              } else if (is(nameStart, c)) {
                parser.state = S.OPEN_TAG;
                parser.tagName = c;
              } else if (c === "/") {
                parser.state = S.CLOSE_TAG;
                parser.tagName = "";
              } else if (c === "?") {
                parser.state = S.PROC_INST;
                parser.procInstName = parser.procInstBody = "";
              } else {
                strictFail(parser, "Unencoded <");
                // if there was some whitespace, then add that in.
                if (parser.startTagPosition + 1 < parser.position) {
                  var pad = parser.position - parser.startTagPosition;
                  c = new Array(pad).join(" ") + c;
                }
                parser.textNode += "<" + c;
                parser.state = S.TEXT;
              }
              continue

            case S.SGML_DECL:
              if ((parser.sgmlDecl + c).toUpperCase() === CDATA) {
                emitNode(parser, "onopencdata");
                parser.state = S.CDATA;
                parser.sgmlDecl = "";
                parser.cdata = "";
              } else if (parser.sgmlDecl + c === "--") {
                parser.state = S.COMMENT;
                parser.comment = "";
                parser.sgmlDecl = "";
              } else if ((parser.sgmlDecl + c).toUpperCase() === DOCTYPE) {
                parser.state = S.DOCTYPE;
                if (parser.doctype || parser.sawRoot)
                  strictFail(parser,
                          "Inappropriately located doctype declaration");
                parser.doctype = "";
                parser.sgmlDecl = "";
              } else if (c === ">") {
                emitNode(parser, "onsgmldeclaration", parser.sgmlDecl);
                parser.sgmlDecl = "";
                parser.state = S.TEXT;
              } else if (is(quote, c)) {
                parser.state = S.SGML_DECL_QUOTED;
                parser.sgmlDecl += c;
              } else
                parser.sgmlDecl += c;
              continue

            case S.SGML_DECL_QUOTED:
              if (c === parser.q) {
                parser.state = S.SGML_DECL;
                parser.q = "";
              }
              parser.sgmlDecl += c;
              continue

            case S.DOCTYPE:
              if (c === ">") {
                parser.state = S.TEXT;
                emitNode(parser, "ondoctype", parser.doctype);
                parser.doctype = true; // just remember that we saw it.
              } else {
                parser.doctype += c;
                if (c === "[")
                  parser.state = S.DOCTYPE_DTD;
                else if (is(quote, c)) {
                  parser.state = S.DOCTYPE_QUOTED;
                  parser.q = c;
                }
              }
              continue

            case S.DOCTYPE_QUOTED:
              parser.doctype += c;
              if (c === parser.q) {
                parser.q = "";
                parser.state = S.DOCTYPE;
              }
              continue

            case S.DOCTYPE_DTD:
              parser.doctype += c;
              if (c === "]")
                parser.state = S.DOCTYPE;
              else if (is(quote, c)) {
                parser.state = S.DOCTYPE_DTD_QUOTED;
                parser.q = c;
              }
              continue

            case S.DOCTYPE_DTD_QUOTED:
              parser.doctype += c;
              if (c === parser.q) {
                parser.state = S.DOCTYPE_DTD;
                parser.q = "";
              }
              continue

            case S.COMMENT:
              if (c === "-")
                parser.state = S.COMMENT_ENDING;
              else
                parser.comment += c;
              continue

            case S.COMMENT_ENDING:
              if (c === "-") {
                parser.state = S.COMMENT_ENDED;
                parser.comment = textopts(parser.opt, parser.comment);
                if (parser.comment)
                  emitNode(parser, "oncomment", parser.comment);
                parser.comment = "";
              } else {
                parser.comment += "-" + c;
                parser.state = S.COMMENT;
              }
              continue

            case S.COMMENT_ENDED:
              if (c !== ">") {
                strictFail(parser, "Malformed comment");
                // allow <!-- blah -- bloo --> in non-strict mode,
                // which is a comment of " blah -- bloo "
                parser.comment += "--" + c;
                parser.state = S.COMMENT;
              } else
                parser.state = S.TEXT;
              continue

            case S.CDATA:
              if (c === "]")
                parser.state = S.CDATA_ENDING;
              else
                parser.cdata += c;
              continue;

            case S.CDATA_ENDING:
              if (c === "]")
                parser.state = S.CDATA_ENDING_2;
              else {
                parser.cdata += "]" + c;
                parser.state = S.CDATA;
              }
              continue

            case S.CDATA_ENDING_2:
              if (c === ">") {
                if (parser.cdata)
                  emitNode(parser, "oncdata", parser.cdata);
                emitNode(parser, "onclosecdata");
                parser.cdata = "";
                parser.state = S.TEXT;
              } else if (c === "]") {
                parser.cdata += "]";
              } else {
                parser.cdata += "]]" + c;
                parser.state = S.CDATA;
              }
              continue

            case S.PROC_INST:
              if (c === "?")
                parser.state = S.PROC_INST_ENDING;
              else if (is(whitespace, c))
                parser.state = S.PROC_INST_BODY;
              else
                parser.procInstName += c;
              continue

            case S.PROC_INST_BODY:
              if (!parser.procInstBody && is(whitespace, c))
                continue;
              else if (c === "?")
                parser.state = S.PROC_INST_ENDING;
              else
                parser.procInstBody += c;
              continue

            case S.PROC_INST_ENDING:
              if (c === ">") {
                emitNode(parser, "onprocessinginstruction", {
                  name: parser.procInstName,
                  body: parser.procInstBody
                });
                parser.procInstName = parser.procInstBody = "";
                parser.state = S.TEXT;
              } else {
                parser.procInstBody += "?" + c;
                parser.state = S.PROC_INST_BODY;
              }
              continue

            case S.OPEN_TAG:
              if (is(nameBody, c))
                parser.tagName += c;
              else {
                newTag(parser);
                if (c === ">")
                  openTag(parser);
                else if (c === "/")
                  parser.state = S.OPEN_TAG_SLASH;
                else {
                  if (not(whitespace, c))
                    strictFail(
                            parser, "Invalid character in tag name");
                  parser.state = S.ATTRIB;
                }
              }
              continue

            case S.OPEN_TAG_SLASH:
              if (c === ">") {
                openTag(parser, true);
                closeTag(parser);
              } else {
                strictFail(parser, "Forward-slash in opening tag not followed by >");
                parser.state = S.ATTRIB;
              }
              continue

            case S.ATTRIB:
              // haven't read the attribute name yet.
              if (is(whitespace, c))
                continue;
              else if (c === ">")
                openTag(parser);
              else if (c === "/")
                parser.state = S.OPEN_TAG_SLASH;
              else if (is(nameStart, c)) {
                parser.attribName = c;
                parser.attribValue = "";
                parser.state = S.ATTRIB_NAME;
              } else
                strictFail(parser, "Invalid attribute name");
              continue

            case S.ATTRIB_NAME:
              if (c === "=")
                parser.state = S.ATTRIB_VALUE;
              else if (c === ">") {
                strictFail(parser, "Attribute without value");
                parser.attribValue = parser.attribName;
                attrib(parser);
                openTag(parser);
              }
              else if (is(whitespace, c))
                parser.state = S.ATTRIB_NAME_SAW_WHITE;
              else if (is(nameBody, c))
                parser.attribName += c;
              else
                strictFail(parser, "Invalid attribute name");
              continue

            case S.ATTRIB_NAME_SAW_WHITE:
              if (c === "=")
                parser.state = S.ATTRIB_VALUE;
              else if (is(whitespace, c))
                continue
              else {
                strictFail(parser, "Attribute without value");
                parser.tag.attributes[parser.attribName] = "";
                parser.attribValue = "";
                emitNode(parser, "onattribute",
                        {name: parser.attribName, value: ""});
                parser.attribName = "";
                if (c === ">")
                  openTag(parser);
                else if (is(nameStart, c)) {
                  parser.attribName = c;
                  parser.state = S.ATTRIB_NAME;
                } else {
                  strictFail(parser, "Invalid attribute name");
                  parser.state = S.ATTRIB;
                }
              }
              continue

            case S.ATTRIB_VALUE:
              if (is(whitespace, c))
                continue
              else if (is(quote, c)) {
                parser.q = c;
                parser.state = S.ATTRIB_VALUE_QUOTED;
              } else {
                strictFail(parser, "Unquoted attribute value");
                parser.state = S.ATTRIB_VALUE_UNQUOTED;
                parser.attribValue = c;
              }
              continue

            case S.ATTRIB_VALUE_QUOTED:
              if (c !== parser.q) {
                if (c === "&")
                  parser.state = S.ATTRIB_VALUE_ENTITY_Q;
                else
                  parser.attribValue += c;
                continue
              }
              attrib(parser);
              parser.q = "";
              parser.state = S.ATTRIB_VALUE_CLOSED;
              continue

            case S.ATTRIB_VALUE_CLOSED:
              if (is(whitespace, c)) {
                parser.state = S.ATTRIB;
              } else if (c === ">")
                openTag(parser);
              else if (c === "/")
                parser.state = S.OPEN_TAG_SLASH;
              else if (is(nameStart, c)) {
                strictFail(parser, "No whitespace between attributes");
                parser.attribName = c;
                parser.attribValue = "";
                parser.state = S.ATTRIB_NAME;
              } else
                strictFail(parser, "Invalid attribute name");
              continue

            case S.ATTRIB_VALUE_UNQUOTED:
              if (not(attribEnd, c)) {
                if (c === "&")
                  parser.state = S.ATTRIB_VALUE_ENTITY_U;
                else
                  parser.attribValue += c;
                continue
              }
              attrib(parser);
              if (c === ">")
                openTag(parser);
              else
                parser.state = S.ATTRIB;
              continue

            case S.CLOSE_TAG:
              if (!parser.tagName) {
                if (is(whitespace, c))
                  continue
                else if (not(nameStart, c)) {
                  if (parser.script) {
                    parser.script += "</" + c;
                    parser.state = S.SCRIPT;
                  } else {
                    strictFail(parser, "Invalid tagname in closing tag.");
                  }
                } else
                  parser.tagName = c;
              }
              else if (c === ">")
                closeTag(parser);
              else if (is(nameBody, c))
                parser.tagName += c;
              else if (parser.script) {
                parser.script += "</" + parser.tagName;
                parser.tagName = "";
                parser.state = S.SCRIPT;
              } else {
                if (not(whitespace, c))
                  strictFail(parser,
                          "Invalid tagname in closing tag");
                parser.state = S.CLOSE_TAG_SAW_WHITE;
              }
              continue

            case S.CLOSE_TAG_SAW_WHITE:
              if (is(whitespace, c))
                continue;
              if (c === ">")
                closeTag(parser);
              else
                strictFail(parser, "Invalid characters in closing tag");
              continue

            case S.TEXT_ENTITY:
            case S.ATTRIB_VALUE_ENTITY_Q:
            case S.ATTRIB_VALUE_ENTITY_U:
              switch (parser.state) {
                case S.TEXT_ENTITY:
                  var returnState = S.TEXT, buffer = "textNode";
                  break

                case S.ATTRIB_VALUE_ENTITY_Q:
                  var returnState = S.ATTRIB_VALUE_QUOTED, buffer = "attribValue";
                  break

                case S.ATTRIB_VALUE_ENTITY_U:
                  var returnState = S.ATTRIB_VALUE_UNQUOTED, buffer = "attribValue";
                  break
              }
              if (c === ";") {
                parser[buffer] += parseEntity(parser);
                parser.entity = "";
                parser.state = returnState;
              }
              else if (is(entity, c))
                parser.entity += c;
              else {
                strictFail(parser, "Invalid character entity");
                parser[buffer] += "&" + parser.entity + c;
                parser.entity = "";
                parser.state = returnState;
              }
              continue

            default:
              throw new Error(parser, "Unknown state: " + parser.state)
          }
        }

        if (parser.position >= parser.bufferCheckPosition)
          checkBufferLength(parser);
        return parser;
      }

      /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
      if (!String.fromCodePoint) {
        (function() {
          var stringFromCharCode = String.fromCharCode;
          var floor = Math.floor;
          var fromCodePoint = function() {
            var MAX_SIZE = 0x4000;
            var codeUnits = [];
            var highSurrogate;
            var lowSurrogate;
            var index = -1;
            var length = arguments.length;
            if (!length) {
              return '';
            }
            var result = '';
            while (++index < length) {
              var codePoint = Number(arguments[index]);
              if (
                      !isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
                      codePoint < 0 || // not a valid Unicode code point
                      codePoint > 0x10FFFF || // not a valid Unicode code point
                      floor(codePoint) !== codePoint // not an integer
                      ) {
                throw RangeError('Invalid code point: ' + codePoint);
              }
              if (codePoint <= 0xFFFF) { // BMP code point
                codeUnits.push(codePoint);
              } else { // Astral code point; split in surrogate halves
                // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
                codePoint -= 0x10000;
                highSurrogate = (codePoint >> 10) + 0xD800;
                lowSurrogate = (codePoint % 0x400) + 0xDC00;
                codeUnits.push(highSurrogate, lowSurrogate);
              }
              if (index + 1 === length || codeUnits.length > MAX_SIZE) {
                result += stringFromCharCode.apply(null, codeUnits);
                codeUnits.length = 0;
              }
            }
            return result;
          };
          if (Object.defineProperty) {
            Object.defineProperty(String, 'fromCodePoint', {
              'value': fromCodePoint,
              'configurable': true,
              'writable': true
            });
          } else {
            String.fromCodePoint = fromCodePoint;
          }
        }());
      }

      return sax;

    })();

    /**
     * @class XmlElement
     * @param tag An object containing as its own properties those to be applied to XmlElement 
     */

    function XmlElement(tag) {

      this.nodeType = 1;
      this.val = "";
      this.children = [];
      this.firstChild = null;
      this.lastChild = null;

      if (tag) {

        if (tag.hasOwnProperty('name')) {
          this.name = tag.name;
        }

        if (tag.hasOwnProperty('ownerDocument')) {
          this.ownerDocument = tag.ownerDocument;
        }

        if (tag.hasOwnProperty('parentNode')) {
          this.parentNode = tag.parentNode;
        }

        if (tag.hasOwnProperty('parentNode')) {
          if (tag.parentNode !== null && tag.parentNode.nodeType === 1)
          {
            this.parentElement = tag.parentNode;
          }
        }

        if (tag.hasOwnProperty('nodeType')) {
          this.nodeType = tag.nodeType;
        }

        if (tag.hasOwnProperty('attributes')) {
          this.attr = tag.attributes;
        }
      }

      return this;
    }

    XmlElement.prototype = {
      /** 
       * Function called for each opening tag found
       * Pushes a new child node, sets first/lastChild, and adds the tag to the working stack
       * @method XmlElement._opentag
       * @param {object} tag An object containing as its own properties those to be applied to XmlElement
       * @private
       */
      _opentag: function(tag) {

        var child = new XmlElement(tag);

        child.parentNode = this;
        this.children.push(child);

        if (this.firstChild === null)
        {
          this.firstChild = child;
        }
        this.lastChild = child;

        delegates.unshift(child);
      },
      /**
       * Function called for each closing tag found 
       * Takes the last tag off the stack
       * @method XmlElement._closetag
       * @private
       */
      _closetag: function() {
        delegates.shift();
      },
      /**
       * Creates and pushes a new Text node to the children array
       * Will not accept text that is purely whitespace only
       * @method XmlElement._text
       * @param {string} text The text to be used for creation of a Text node
       * @private
       */
      _text: function(text) {
        if (text)
        {
          if (/[^\s]/.test(text)) {

            var child = new Text(text, this);

            this.children.push(child);

            if (this.firstChild === null)
            {
              this.firstChild = child;
            }
            this.lastChild = child;
          }
        }
      },
      /**
       * Creates and pushes a new Comment node to the children array
       * @method XmlElement._comment
       * @param {string} text The text to be used for creation of a Comment node
       * @private
       */
      _comment: function(text) {
        if (text)
        {
          var child = new Comment(text, this);

          this.children.push(child);

          if (this.firstChild === null)
          {
            this.firstChild = child;
          }
          this.lastChild = child;

        }
      },
      /**
       * Creates and pushes a new ProcessingInstruction node to the children array
       * @method XmlElement._processingInstruction
       * @param {string} text The text to be used for creation of a ProcessingInstruction node
       * @private
       */
      _processingInstruction: function(text) {
        if (text)
        {
          var child = new ProcessingInstruction(text, this);

          this.children.push(child);

          if (this.firstChild === null)
          {
            this.firstChild = child;
          }
          this.lastChild = child;
        }
      },
      /**
       * Creates and pushes a new CDATA node to the children array
       * @method XmlElement._cdata
       * @param {string} cdata The text to be used for creation of a CDATA node
       * @private
       */
      _cdata: function(cdata) {
        if (cdata)
        {
          var child = new CDATA(cdata, this);

          this.children.push(child);

          if (this.firstChild === null)
          {
            this.firstChild = child;
          }
          this.lastChild = child;
        }
      },
      /**
       * Retrieves an array matching the name specified.
       * Will return all children with "*"
       * @method XmlElement.getElementsByTagName
       * @param {string} name The tag name to search for
       * @returns {Array} An array containing any matches
       * @public
       */
      getElementsByTagName: function(name) {
        var results = [];
        var r;

        for (var i = 0; i < this.children.length; i += 1) {
          if (this.children[i].name === name || name === "*") {
            results.push(this.children[i]);
          }
          if (!!this.children[i].children && this.children[i].children.length > 0) {
            if ((r = this.children[i].getElementsByTagName(name))) {
              results = results.concat(r);
            }
          }
        }
        return results;
      },
      /**
       * Retrieves an array matching the selector specified.
       * @method XmlElement.querySelectorAll
       * @param {string} selector The selector to search for
       * @returns {Array} An array with the matches found
       * @public
       */
      querySelectorAll: function (selector) {

        var run = function (searchNode, selector) {

          var checkNode = function (node, selectorPartInfos) {
            var ok = true;
            var selectorPartInfosLength = selectorPartInfos.length;
            for (var selectorPartInfosIndex = 0; selectorPartInfosIndex < selectorPartInfosLength; selectorPartInfosIndex++) {
              var selectorPartInfo = selectorPartInfos[selectorPartInfosIndex];
              switch (selectorPartInfo.charAt(0)) {
              case "[":
                var attr = selectorPartInfo.substr(1, selectorPartInfo.length - 2).split("=");
                var attrName = attr[0];
                var attrValue = attr[1];
                if (!node.getAttribute(attrName)) {
                  ok = false;
                } else if (attrValue) {
                  attrValue = attrValue.replace(/^['"]|['"]$/g, "");
                  if (node.getAttribute(attrName) != attrValue)
                    ok = false;
                }
                break;
              default:
                if (node.name.toLowerCase() != selectorPartInfo.toLowerCase())
                  ok = false;
                break;
              }
              if (!ok)
                break;
            }
            return ok;
          };

          var selectorParts = selector.split(/[ >]+/),
            selectorDividers = selector.match(/[ >]+/g) || [],
            currentResultNodes = [searchNode];

          var selectorPartLength = selectorParts.length;
          while (selectorDividers.length < selectorPartLength) {
            selectorDividers.unshift(" ");
          }

          for (var selectorPartIndex = 0; selectorPartIndex < selectorPartLength; selectorPartIndex++) {
            var selectorPart = selectorParts[selectorPartIndex];
            var selectorDivider = selectorDividers[selectorPartIndex];
            if (selectorDivider)
              selectorDivider = selectorDivider.replace(/^ +| +$/g, "");

            var nodes = currentResultNodes.slice(0);
            currentResultNodes = [];
            var selectorPartInfos = selectorPart.match(/[#.[]?[a-z_-]+(?:='[^']+'|="[^"]+")?]?/gi);
            var nodesLength = nodes.length;

            if (selectorPartIndex === 0 && selectorPartLength > 1 && nodesLength === 1) {
              var firstNode = nodes[0];
              if (checkNode(firstNode, selectorPartInfos))
                currentResultNodes.push(firstNode);
            }

            for (var nodeIndex = 0; nodeIndex < nodesLength; nodeIndex++) {
              var node = nodes[nodeIndex];
              var nodesToCheck = selectorDivider === ">" ? node.children : node.getElementsByTagName("*");
              if (!nodesToCheck)
                continue;
              var nodesToCheckLength = nodesToCheck.length;
              for (var nodesToCheckIndex = 0; nodesToCheckIndex < nodesToCheckLength; nodesToCheckIndex++) {
                var nodeToCheck = nodesToCheck[nodesToCheckIndex];
                if (checkNode(nodeToCheck, selectorPartInfos))
                  currentResultNodes.push(nodeToCheck);
              }
            }
          }
          return currentResultNodes;
        };

        var selectors = selector.split(","),
          selectorsLength = selectors.length,
          foundNodes = [];

        for (var i = 0; i < selectorsLength; i++) {
          foundNodes = foundNodes.concat(run(this, selectors[i]));
        }

        return foundNodes;
      },
      /**
       * Retrieves the first element matching the selector specified.
       * @method XmlElement.querySelector
       * @param {string} selector The selector to search for
       * @returns {XmlElement|null} If any matches were found, an element. If not, "null"
       * @public
       */
      querySelector: function (selector) {
        var foundNodes = this.querySelectorAll(selector);
        return foundNodes.length > 0 ? foundNodes[0] : null;
      },
      /**
       * Retrieves an array matching the attribute of name specified.
       * @method XmlElement.getElementsByName
       * @param {string} name The attribute of name to search for
       * @returns {Array} An array containing any matches
       * @public
       */
      getElementsByName: function(name) {
        var results = [];
        var r;

        for (var i = 0; i < this.children.length; i += 1) {
          if ((name && this.children[i].attr["name"] === name) ||
                  (!name && this.children[i].attr["name"])) {
            results.push(this.children[i]);
          }
          if (!!this.children[i].children && this.children[i].children.length > 0) {
            if ((r = this.children[i].getElementsByName(name))) {
              results = results.concat(r);
            }
          }
        }
        return results;
      },
      /**
       * Returns if XmlElement has an attribute or not
       * @method XmlElement.hasAttribute
       * @param {string} name The attribute of name to test for
       * @returns {boolean} If XmlElement has that attribute or not
       * @public
       */
      hasAttribute: function(name) {
        if (this.attr[name]) {
          return true;
        } else {
          return false;
        }
      },
      /**
       * Returns if XmlElement has any attributes at all or not
       * @method XmlElement.hasAttributes
       * @returns {boolean} If XmlElement has attributes
       * @public
       */
      hasAttributes: function() {
        var size = 0;

        for (var key in this.attr) {
          if (this.attr.hasOwnProperty(key)) {
            size += 1;
            break;
          }
        }

        if (size > 0) {
          return true;
        } else {
          return false;
        }
      },
      /**
       * Returns the value of an attribute, if it exists
       * @method XmlElement.getAttribute
       * @param {string} name The attribute name to test for
       * @returns {*} The value, or null if it did not exist
       * @public
       */
      getAttribute: function(name) {
        if (this.attr[name]) {
          return this.attr[name].value;
        } else {
          return null;
        }
      },
      /**
       * Deletes an attribute, if it exists
       * @method XmlElement.removeAttribute
       * @param {string} name The attribute of name to test for
       * @public
       */
      removeAttribute: function(name) {
        if (this.attr[name]) {
          delete this.attr[name];
        }
      },
      /**
       * Sets (or creates) an attribute of name to value
       * @method XmlElement.setAttribute
       * @param {string} name The attribute of name to test for
       * @param {*} value The value to set the attribute name to
       * @public
       */
      setAttribute: function(name, value) {
        this.attr[name].value = value;
      },
      /**
       * Creates a XmlElement node of tag name and returns it
       * @method XmlElement.createElement
       * @param {string} name The name of the element to create
       * @returns {XmlElement}  A new XmlElement of name
       * @public
       */
      createElement: function(name) {
        return new XmlElement({name: name, ownerDocument: this, parentNode: null});
      },
      /**
       * Returns if XmlElement has any children
       * @method XmlElement.hasChildNodes
       * @returns {boolean} If the XmlElement has any children
       * @public
       */
      hasChildNodes: function() {
        if (this.children.length > 0) {
          return true;
        } else {
          return false;
        }
      },
      /**
       * Adds a node to the list of children
       * @method XmlElement.appendChild
       * @param {XmlElement} node  The XmlElement to add
       * @public
       */
      appendChild: function(node) {
        if (node instanceof XmlElement) {
          this.children.push(node);
          this.firstChild = this.children[0];
          this.lastChild = this.children[this.children.length];
        }
      },
      /**
       * The previous sibling of this node
       * @method XmlElement.previousSibling
       * @returns {XmlElement | null} If a sibling, that node, else null
       * @public
       */
      previousSibling: function() {
        if (this.parentNode !== null && this.parentNode.children.length > 1) {
          for (var i = 0; i < this.parentNode.children.length; i += 1) {
            if (this.parentNode.children[i] === this && i !== 0) {
              return this.parentNode.children[i - 1];
            }
          }
        }
        return null;
      },
      /**
       * The next sibling of this node
       * @method XmlElement.nextSibling
       * @returns {XmlElement | null} If a sibling, that node, else null
       * @public
       */
      nextSibling: function() {
        if (this.parentNode !== null && this.parentNode.children.length > 1) {
          for (var i = 0; i < this.parentNode.children.length; i += 1) {
            if (this.parentNode.children[i] === this && i + 1 < this.parentNode.children.length) {
              return this.parentNode.children[i + 1];
            }
          }
        }
        return null;
      },
      /**
       * Returns a Attr node representing the named attribute
       * @method XmlElement.getAttributeNode
       * @param {string}  name  The name of the attribute to return
       * @returns {Attr | null} If found, a new Attr node, else null
       * @public
       */
      getAttributeNode: function(name) {
        if (this.hasAttribute(name)) {
          return new Attr(name, this.getAttribute(name), this);
        }
        else {
          return null;
        }
      },
      /**
       * Creates an Attr node of given name and value
       * @method XmlElement.createAttribute
       * @param {string}  name  The name of the attribute to return
       * @param {*} value The value to set the named attribute to
       * @returns {Attr | null} If a sibling, that node. Else, null
       * @public
       */
      createAttribute: function(name, value) {
        if (/^[a-zA-Z_:][a-zA-Z0-9\.\-_:]*$/.test(name)) {
          return new Attr(name, value, this);
        } else {
          //Raised if the specified name contains an invalid character.
          throw new Error("INVALID_CHARACTER_ERR");
        }
      },
      /**
       * Sets the Attr node name and value as an attribute to the current node
       * @method XmlElement.createAttribute
       * @param {Attr}  node  The name of the attribute to return
       * @public
       */
      setAttributeNode: function(node) {
        if (node instanceof Attr) {
          if (node.ownerElement !== this) {
            //Raised if node is already an attribute of another Element object.
            throw new Error("INUSE_ATTRIBUTE_ERR");
          } else {
            if (node.ownerElement.ownerDocument !== this.ownerDocument) {
              //Raised if node was created from a different document 
              // than the one that created the element.
              throw new Error("WRONG_DOCUMENT_ERR");
            } else {
              this.setAttribute(node.name, node.value);
            }
          }
        }
      },
      /**
       * Removes and returns an Attr node, if found
       * @method XmlElement.removeAttributeNode
       * @param {Attr}  node  The name of the attribute to return
       * @public
       */
      removeAttributeNode: function(node) {
        if (node instanceof Attr) {
          if (this.hasAttribute(node.name)) {
            var temp = this.getAttributeNode(node.name);
            this.removeAttribute(node.name);
            return temp;
          } else {
            //Raised if node is not an attribute of the element.
            throw new Error("NOT_FOUND_ERR");
          }
        }
      }
    };

    XmlElement.prototype = Object.create(XmlElement.prototype);
    XmlElement.prototype.constructor = XmlElement;

    /**
     * The nodeName of the XmlElement
     *
     * @property nodeName
     * @type String
     * @default false
     */
    Object.defineProperty(XmlElement.prototype, "nodeName", {
      get: function() {
        return this.name;
      },
      set: function(name) {
        this.name = name;
      }
    });

    /**
     * The nodeValue of the XmlElement
     *
     * @property nodeValue
     * @type String
     * @default false
     */
    Object.defineProperty(XmlElement.prototype, "nodeValue", {
      get: function() {
        return this.val;
      },
      set: function(value) {
        this.val = value;
      }
    });

    /**
     * The childNodes of the XmlElement
     *
     * @property childNodes
     * @type Array
     * @default false
     */
    Object.defineProperty(XmlElement.prototype, "childNodes", {
      get: function() {
        return this.children;
      }
    });

    /**
     * The attributes of the XmlElement
     *
     * @property attributes
     * @type Object
     * @default false
     */
    Object.defineProperty(XmlElement.prototype, "attributes", {
      get: function() {
        return this.attr;
      }
    });

    /**
     * The tagName of the XmlElement
     *
     * @property tagName
     * @type String
     * @default ""
     */
    Object.defineProperty(XmlElement.prototype, "tagName", {
      get: function() {
        return this.name;
      },
      set: function(name) {
        this.name = name;
      }
    });

    /*
     * Delegates is the tag stack used by the SAX Parser itself via calls from XmlDocument
     */
    var delegates = null;

    /**
     * @class XmlDocument
     * @param xml A string representing the XML to be parsed 
     */
    function XmlDocument(xml) {

      this.attributes = null;
      this.implementation = new DOMImplementation();

      if (xml)
      {
        xml = xml.toString().trim();
        var parser = SAX.parser(true, {xmlns: true});
        parser.onopentag = function() {
          delegates[0]._opentag.apply(delegates[0], arguments);
        };
        parser.onclosetag = function() {
          delegates[0]._closetag.apply(delegates[0], arguments);
        };
        parser.ontext = function() {
          delegates[0]._text.apply(delegates[0], arguments);
        };
        parser.oncdata = function() {
          delegates[0]._cdata.apply(delegates[0], arguments);
        };
        parser.oncomment = function() {
          delegates[0]._comment.apply(delegates[0], arguments);
        };

        delegates = [this];

        parser.write(xml);
      }
    }

    XmlDocument.prototype = {
      /** 
       * Function called for each opening tag found
       * Pushes a new child node, sets first/lastChild, and adds the tag to the working stack
       * @method XmlDocument._opentag
       * @param {object} tag An object containing as its own properties those to be applied
       * @private
       */
      _opentag: function(tag) {

        if (typeof this.documentElement === 'undefined')
        {
          this.ownerDocument = null;
          this.name = "#document";
          this.nodeType = 9;
          this.val = null;
          this.documentElement = new XmlElement(tag);
          this.firstChild = this.documentElement;
          this.lastChild = this.documentElement;
          this.parentNode = null;
        }
        else
        {
          tag.ownerDocument = this;
          XmlElement.prototype._opentag.apply(this.documentElement, arguments);
        }
      },
      /**
       * Function called for each closing tag found 
       * Takes the last tag off the stack
       * @method XmlDocument._closetag
       * @private
       */
      _closetag: function() {
        delegates.shift();
        this.children = [this.documentElement];
      },
      /**
       * Creates and pushes a new Text node to the children array
       * Will not accept text that is purely whitespace only
       * @method XmlDocument._text
       * @param {string} text The text to be used for creation of a Text node
       * @private
       */
      _text: function(text) {
        XmlElement.prototype._text.apply(this.documentElement, arguments);
      },
      /**
       * Creates and pushes a new ProcessingInstruction node to the children array
       * @method XmlDocument._processingInstruction
       * @param {string} text The text to be used for creation of a ProcessingInstruction node
       * @private
       */
      _processingInstruction: function(text) {
        XmlElement.prototype._processingInstruction.apply(this.documentElement, arguments);
      },
      /**
       * Creates and pushes a new Comment node to the children array
       * @method XmlDocument._comment
       * @param {string} text The text to be used for creation of a Comment node
       * @private
       */
      _comment: function(text) {
        XmlElement.prototype._comment.apply(this.documentElement, arguments);
      },
      /**
       * Creates and pushes a new CDATA node to the children array
       * @method XmlDocument._cdata
       * @param {string} cdata The text to be used for creation of a CDATA node
       * @private
       */
      _cdata: function(cdata) {
        XmlElement.prototype._cdata.apply(this.documentElement, arguments);
      },
      /**
       * Retrieves an array matching the name specified.
       * Will return all children with "*"
       * @method XmlDocument.getElementsByTagName
       * @param {string} name The tag name to search for
       * @returns {Array} An array containing any matches
       * @public
       */
      getElementsByTagName: function(name) {
        var results = [];
        var r;

        for (var i = 0; i < this.children.length; i += 1) {
          if (this.children[i].name === name || name === "*") {
            results.push(this.children[i]);
          }
          if (!!this.children[i].children && this.children[i].children.length > 0) {
            if ((r = this.children[i].getElementsByTagName(name))) {
              results = results.concat(r);
            }
          }
        }
        return results;
      },
      /**
       * Retrieves an array matching the attribute of name specified.
       * @method XmlDocument.getElementsByName
       * @param {string} name The attribute of name to search for
       * @returns {Array} An array containing any matches
       * @public
       */
      getElementsByName: function(name) {
        var results = [];
        var r;

        for (var i = 0; i < this.children.length; i += 1) {
          if ((name && this.children[i].attr["name"] === name) ||
                  (!name && this.children[i].attr["name"])) {
            results.push(this.children[i]);
          }
          if (!!this.children[i].children && this.children[i].children.length > 0) {
            if ((r = this.children[i].getElementsByName(name))) {
              results = results.concat(r);
            }
          }
        }
        return results;
      },
      /**
       * Creates a XmlElement node of tag name and returns it
       * @method XmlDocument.createElement
       * @param {string} name The name of the element to create
       * @returns {XmlElement}  A new XmlElement of name
       * @public
       */
      createElement: function(name) {
        return new XmlElement({name: name, ownerDocument: this, parentNode: null});
      },
      /**
       * Returns if XmlDocument has any children
       * @method XmlDocument.hasChildNodes
       * @returns {boolean} If the XmlDocument has any children
       * @public
       */
      hasChildNodes: function() {
        if (this.children.length > 0) {
          return true;
        } else {
          return false;
        }
      },
      /**
       * Adds a node to the list of children
       * @method XmlDocument.appendChild
       * @param {XmlElement} node  The XmlElement to add
       * @public
       */
      appendChild: function(node) {
        if (node instanceof XmlElement) {
          node.parentNode = this;
          this.children.push(node);
          this.firstChild = this.children[0];
          this.lastChild = this.children[this.children.length];
        }
      },
      /**
       * Creates a new Text node with content
       * @method XmlDocument.createTextNode
       * @param {string} content  The content of the Text Node
       * @returns {Text}  A new Text node
       * @public
       */
      createTextNode: function(content) {
        return new Text(content, this);
      },
      /**
       * Creates a new Comment node with content
       * @method XmlDocument.createComment
       * @param {string} content  The content of the Comment Node
       * @returns {Comment} A new Comment node
       * @public
       */
      createComment: function(content) {
        return new Comment(content, this);
      },
      /**
       * Creates a new CDATA node with content
       * @method XmlDocument.createCDATASection
       * @param {string} content  The content of the CDATA Node
       * @returns {CDATA} A new CDATA node
       * @public
       */
      createCDATASection: function(content) {
        return new CDATA(content, this);
      },
      /**
       * Creates a new ProcessingInstruction node with target and node
       * @method XmlDocument.createProcessingInstruction
       * @param {XmlElement} target  The target
       * @param {XmlElement} node The node to process
       * @returns {ProcessingInstruction} A new ProcessingInstruction node
       * @public
       */
      createProcessingInstruction: function(target, node) {
        return new ProcessingInstruction(target, node, this);
      },
      /**
       * Creates a new DocumentFragment node
       * @method XmlDocument.createDocumentFragment
       * @returns {DocumentFragment} A new DocumentFragment node
       * @public
       */
      createDocumentFragment: function() {
        return new DocumentFragment();
      }
    };

    XmlDocument.prototype = Object.create(XmlDocument.prototype);
    XmlDocument.prototype.constructor = XmlDocument;

    /**
     * The nodeName of the XmlDocument
     *
     * @property nodeName
     * @type String
     * @default false
     */
    Object.defineProperty(XmlDocument.prototype, "nodeName", {
      get: function() {
        return this.name;
      }
    });

    /**
     * The nodeValue of the XmlDocument
     *
     * @property nodeValue
     * @type null
     * @default false
     */
    Object.defineProperty(XmlDocument.prototype, "nodeValue", {
      get: function() {
        return null;
      }
    });

    /**
     * The childNodes of the XmlDocument
     *
     * @property childNodes
     * @type Array
     * @default false
     */
    Object.defineProperty(XmlDocument.prototype, "childNodes", {
      get: function() {
        return this.children;
      }
    });

    /**
     * The tagName of the XmlDocument
     *
     * @property tagName
     * @type String
     * @default ""
     */
    Object.defineProperty(XmlDocument.prototype, "tagName", {
      get: function() {
        return this.name;
      },
      set: function(n) {
        this.name = n;
      }
    });

    /**
     * @class Attr
     * @param {string} name The name of the attribute
     * @param {string} value The value of the attribute
     * @param {XmlElement}  ownerElement  The owner of this attribute
     */
    function Attr(name, value, ownerElement) {
      this.name = name;
      this.value = value;
      this.ownerElement = ownerElement;
      this.attributes = null;
      this.specified = true;
      this.nodeType = 2;
    }

    Attr.prototype = Object.create(Attr.prototype);
    Attr.prototype.constructor = Attr;

    /**
     * The nodeName of the Attr
     *
     * @property nodeName
     * @type String
     * @default false
     */
    Object.defineProperty(Attr.prototype, "nodeName", {
      get: function() {
        return this.name;
      }
    });

    /**
     * The nodeValue of the Attr
     *
     * @property nodeValue
     * @type String
     * @default false
     */
    Object.defineProperty(Attr.prototype, "nodeValue", {
      get: function() {
        return this.value;
      }
    });

    /**
     * @class Text
     * @param {string} string The content of the node
     * @param {XmlElement} parentNode The parent of this node
     */
    function Text(string, parentNode) {
      this.data = string;
      this.name = "#text";
      this.attributes = null;
      this.parentNode = parentNode;
      if (this.parentNode.nodeType !== 1) {
        this.parentElement = null;
      } else {
        this.parentElement = parentNode;
      }
      this.nodeType = 3;
    }

    Text.prototype = Object.create(Text.prototype);
    Text.prototype.constructor = Text;

    /**
     * The nodeName of the Text
     *
     * @property nodeName
     * @type String
     * @default false
     */
    Object.defineProperty(Text.prototype, "nodeName", {
      get: function() {
        return this.name;
      }
    });

    /**
     * The nodeValue of the Attr
     *
     * @property nodeValue
     * @type String
     * @default false
     */
    Object.defineProperty(Text.prototype, "nodeValue", {
      get: function() {
        return this.data;
      }
    });

    /**
     * @class Comment
     * @param {string} string The content of the node
     * @param {XmlElement} parentNode The parent of this node
     */
    function Comment(string, parentNode) {
      this.data = string;
      this.name = "#comment";
      this.attributes = null;
      this.parentNode = parentNode;
      if (this.parentNode.nodeType !== 1) {
        this.parentElement = null;
      } else {
        this.parentElement = parentNode;
      }
      this.nodeType = 8;
    }

    Comment.prototype = Object.create(Comment.prototype);
    Comment.prototype.constructor = Comment;

    /**
     * The nodeName of the Comment
     *
     * @property nodeName
     * @type String
     * @default false
     */
    Object.defineProperty(Comment.prototype, "nodeName", {
      get: function() {
        return this.name;
      }
    });

    /**
     * The nodeValue of the Comment
     *
     * @property nodeValue
     * @type String
     * @default false
     */
    Object.defineProperty(Comment.prototype, "nodeValue", {
      get: function() {
        return this.data;
      }
    });

    /**
     * @class CDATA
     * @param {string} string The content of the node
     * @param {XmlElement} parentNode The parent of this node
     */
    function CDATA(string, parentNode) {
      this.data = string;
      this.name = "#cdata-section";
      this.attributes = null;
      this.parentNode = parentNode;
      if (this.parentNode.nodeType !== 1) {
        this.parentElement = null;
      } else {
        this.parentElement = parentNode;
      }
      this.nodeType = 4;
    }

    CDATA.prototype = Object.create(CDATA.prototype);
    CDATA.prototype.constructor = CDATA;

    /**
     * The nodeName of the CDATA
     *
     * @property nodeName
     * @type String
     * @default false
     */
    Object.defineProperty(CDATA.prototype, "nodeName", {
      get: function() {
        return this.name;
      }
    });

    /**
     * The nodeValue of the CDATA
     *
     * @property nodeValue
     * @type String
     * @default false
     */
    Object.defineProperty(CDATA.prototype, "nodeValue", {
      get: function() {
        return this.data;
      }
    });

    /**
     * @class ProcessingInstruction
     * @param {XmlElement} target The target XmlElement
     * @param {string}  data  The data
     * @param {XmlElement} parentNode The parent of this node
     */
    function ProcessingInstruction(target, data, parentNode) {
      this.target = target;
      this.data = data;
      this.name = target;
      this.attributes = null;
      this.parentNode = parentNode;
      if (this.parentNode.nodeType !== 1) {
        this.parentElement = null;
      } else {
        this.parentElement = parentNode;
      }
    }

    ProcessingInstruction.prototype = Object.create(ProcessingInstruction.prototype);
    ProcessingInstruction.prototype.constructor = ProcessingInstruction;

    /**
     * The nodeName of the ProcessingInstruction
     *
     * @property nodeName
     * @type String
     * @default false
     */
    Object.defineProperty(ProcessingInstruction.prototype, "nodeName", {
      get: function() {
        return this.name;
      }
    });

    /**
     * The nodeValue of the ProcessingInstruction
     *
     * @property nodeValue
     * @type String
     * @default false
     */
    Object.defineProperty(ProcessingInstruction.prototype, "nodeValue", {
      get: function() {
        return this.data;
      }
    });

    /**
     * @class DocumentFragment
     */
    function DocumentFragment() {
      this.name = "#document-fragment";
      this.nodeType = 11;
      this.attributes = null;
      XmlDocument.call(this);
    }

    DocumentFragment.prototype = Object.create(DocumentFragment.prototype);
    DocumentFragment.prototype.constructor = XmlDocument;

    /**
     * The nodeName of the DocumentFragment
     *
     * @property nodeName
     * @type String
     * @default false
     */
    Object.defineProperty(DocumentFragment.prototype, "nodeName", {
      get: function() {
        return this.name;
      }
    });

    /**
     * The nodeValue of the DocumentFragment
     *
     * @property nodeValue
     * @type String
     * @default false
     */
    Object.defineProperty(DocumentFragment.prototype, "nodeValue", {
      get: function() {
        return null;
      }
    });

    /**
     * @class DOMImplementation
     */
    function DOMImplementation() {
    }

    DOMImplementation.prototype = {
      /**
       * Creates a new XmlDocument
       * @method DOMImplementation.createDocument
       * @public
       */
      createDocument: function() {
        return new XmlDocument();
      },
      /**
       * Checks for features (always returns true)
       * @method DOMImplementation.hasFeature
       * @param {string}  name  The name to test for
       * @param {string} value The value to test for
       * @returns {boolean} Always returns true
       * @public
       */
      hasFeature: function(name, value) {
        return true;
      }
    };

    DOMImplementation.prototype = Object.create(DOMImplementation.prototype);
    DOMImplementation.prototype.constructor = DOMImplementation;

    /**
     * Internal version of parseFromString
     * @method domParser.parseFromString
     * @param {string} text  The text to parse
     * @param {string} mimeType The mimeType to create
     * @returns {XmlDocument} A XmlDocument representing the XML data
     * @public
     */
    this.parseFromString = function(text, mimeType) {
      return new XmlDocument(text);
    };
  };

  /**
   * External version of parseFromString
   * @method domParser.parseFromString
   * @param {string} text  The text to parse
   * @param {string} mimeType The mimeType to create
   * @returns {XmlDocument} A XmlDocument representing the XML data (from internal function)
   * @public
   */
  domParser.prototype.parseFromString = function(text, mimeType) {
    return this.parseFromString(text, mimeType);
  };

  return domParser;

});
if (navigator.isCocoonJS) {
  window['DOMParser'] = domParser;
}
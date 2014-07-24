// ES5-metaobject v1 09.11.2013  

// Like .forEach from js 1.6
if(!Array.prototype.each){
	Array.prototype.each=function(e){
		for(var i=0,len=this.length;i<len;i++) e(this[i],i);
	}
}

// фильтрация элементов массива
if(!Array.prototype.filter){
	Array.prototype.filter=function(e){
		var r = [];
		for(var i=0, len=this.length;i<len;i++){
			if(e(this[i],i))
				r.push(this[i]);
		}
		return r;
	}
}

// Преобразует массив объектов в другой массив
if(!Array.prototype.map){
	Array.prototype.map=function(e){
		var r=[];
		for(var i=0, len=this.length;i<len;i++){
			r.push(e(this[i],i));
		}
		return r;
	}
}

Object.prototype.clone=function(/*o*/) {
	if(!this || 'object' !== typeof this)  {
		return this;
	}
	var c = 'function' == typeof this.pop ? [] : {};
	var p, v;
	for(p in this) {
		if(this.hasOwnProperty(p)) {
			v = this[p];
			if(v && 'object' === typeof v) {
				c[p] = v.clone();
			}  else {
				c[p] = v;
			}
		}
	}
	return c;
}
// IE8, Opera 11.11 not supported Function.prototype.bind
// From: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {
	Function.prototype.bind = function (oThis) {
		if (typeof this !== "function") {
			// closest thing possible to the ECMAScript 5 internal IsCallable function
			throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
		}
 
		var aArgs = Array.prototype.slice.call(arguments, 1), 
			fToBind = this, 
			fNOP = function () {},
			fBound = function () {
			  return fToBind.apply(this instanceof fNOP && oThis
									 ? this
									 : oThis,
								   aArgs.concat(Array.prototype.slice.call(arguments)));
			};
		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();
		return fBound;
	};
}


// https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList
// Since IE10, Opera 11.50, Chrome 8, FF 3.6
/*
 * classList.js: Cross-browser full element.classList implementation.
 * 2012-11-15
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js*/

if (!(
	"classList" in document.createElement("_") &&
    "classList" in document.createElementNS("http://www.w3.org/2000/svg", "svg")
)) {

(function (view) {
	"use strict";
	if (!('Element' in view)) return;

var
          classListProp = "classList"
        , protoProp = "prototype"
        , elemCtrProto = view.Element[protoProp]
        , objCtr = Object
        , strTrim = String[protoProp].trim || function () {
                return this.replace(/^\s+|\s+$/g, "");
        }
        , arrIndexOf = Array[protoProp].indexOf || function (item) {
                var
                          i = 0
                        , len = this.length
                ;
                for (; i < len; i++) {
                        if (i in this && this[i] === item) {
                                return i;
                        }
                }
                return -1;
        }
        // Vendors: please allow content code to instantiate DOMExceptions
        , DOMEx = function (type, message) {
                this.name = type;
                this.code = DOMException[type];
                this.message = message;
        }
        , checkTokenAndGetIndex = function (classList, token) {
                if (token === "") {
                        throw new DOMEx(
                                  "SYNTAX_ERR"
                                , "An invalid or illegal string was specified"
                        );
                }
                if (/\s/.test(token)) {
                        throw new DOMEx(
                                  "INVALID_CHARACTER_ERR"
                                , "String contains an invalid character"
                        );
                }
                return arrIndexOf.call(classList, token);
        }
        , ClassList = function (elem) {
                var
                          trimmedClasses = strTrim.call(elem.getAttribute("class"))
                        , classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
                        , i = 0
                        , len = classes.length
                ;
                for (; i < len; i++) {
                        this.push(classes[i]);
                }
                this._updateClassName = function () {
                        elem.setAttribute("class", this.toString());
                };
        }
        , classListProto = ClassList[protoProp] = []
        , classListGetter = function () {
                return new ClassList(this);
        }
;
// Most DOMException implementations don't allow calling DOMException's toString()
// on non-DOMExceptions. Error's toString() is sufficient here.
DOMEx[protoProp] = Error[protoProp];
classListProto.item = function (i) {
        return this[i] || null;
};
classListProto.contains = function (token) {
        token += "";
        return checkTokenAndGetIndex(this, token) !== -1;
};
classListProto.add = function () {
        var
                  tokens = arguments
                , i = 0
                , l = tokens.length
                , token
                , updated = false
        ;
        do {
                token = tokens[i] + "";
                if (checkTokenAndGetIndex(this, token) === -1) {
                        this.push(token);
                        updated = true;
                }
        }
        while (++i < l);

        if (updated) {
                this._updateClassName();
        }
};
classListProto.remove = function () {
        var
                  tokens = arguments
                , i = 0
                , l = tokens.length
                , token
                , updated = false
        ;
        do {
                token = tokens[i] + "";
                var index = checkTokenAndGetIndex(this, token);
                if (index !== -1) {
                        this.splice(index, 1);
                        updated = true;
                }
        }
        while (++i < l);

        if (updated) {
                this._updateClassName();
        }
};
classListProto.toggle = function (token, forse) {
        token += "";

        var
                  result = this.contains(token)
                , method = result ?
                        forse !== true && "remove"
                :
                        forse !== false && "add"
        ;

        if (method) {
                this[method](token);
        }

        return !result;
};
classListProto.toString = function () {
        return this.join(" ");
};

if (objCtr.defineProperty) {
        var classListPropDesc = {
                  get: classListGetter
                , enumerable: true
                , configurable: true
        };
        try {
                objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
        } catch (ex) { // IE 8 doesn't support enumerable:true
                if (ex.number === -0x7FF5EC54) {
                        classListPropDesc.enumerable = false;
                        objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
                }
        }
} else if (objCtr[protoProp].__defineGetter__) {
        elemCtrProto.__defineGetter__(classListProp, classListGetter);
}

}(window));

}




// $4 v5 20.01.2014
/*
Еще интересный паттерн:
перемещение всех дочерних элементов одного узла в другой (когда мы перемещаем количество элементов в массиве уменьшается - индексы с двигаются)
var i=0;
while(nextNode.childNodes.length){
	console.log("#%s",i);
	lastLine.appendChild(nextNode.childNodes[0]);
	i++;
}
*/

var $4={
	// Get html element by id
	// @param {String} id
	// @return {HTMLElement} 
	id:function(id){
		return document.getElementById(id);
	},
	// @param {string} text
	// @return {TextNode}
	t:function(text){
		return document.createTextNode(text);
	},
	// Create new HTML Element with options
	// @param {_} - First is Tag name <) console.dir($4.cr("option","value","email","textContent","Hello")); 
	// @return {HTMLElement}
	cr:function(){
		if(!arguments[0])throw("Don't set Tag name");
		var EL=document.createElement(arguments[0]);
		for(var i=1,m=arguments.length;i<m;i+=2)
			arguments[i]&&arguments[i+1]&&(EL[arguments[i]]=arguments[i+1]);
		return EL;
	},
	// Set styles to Html Element
	// @param {HTMLElement,String, String, ...} - First is Element Node, next coma separated property-name, property-values
	st:function(){
		if(!(arguments[0] && arguments[0] instanceof HTMLElement))throw('Arguments must be instanceof HtmlElement');
		var EL = arguments[0];
		for(var i=1,m=arguments.length;i<m;i+=2)
			arguments[i]&&/*arguments[i+1]&&*/(EL.style[arguments[i]]=arguments[i+1]||"");
	},
	// Finds child elements in node by css selector:
	// @param {Node} node
	// @param {String} selector -ccss selector
	// @param {Bool} getAll - get all results or first related
	// @return {Bool|NodeList|Node}
	fnd:function(node,selector,getAll){
		var method = getAll?"querySelectorAll":"querySelector";
		return node && node[method] && node[method](selector);
	},
	emptyNode:function(node){
		var childNodes = node.childNodes;
		for(i=childNodes.length; i--;){
			node.removeChild(childNodes[i]);
		}

	},
	removeNode:function(node){
		node.parentNode.removeChild(node);
	},
	// Вставляет элемент node первым элементом
	prepend:function(parent,node){
		if(parent.firstChild)
			parent.insertBefore(node, parent.firstChild);
		else
			parent.appendChild(node);
	},
	// Добавляет элемент node перед элементом after
	appendAfter:function(parent,after,node){
		if (after.nextSibling) {
		  	parent.insertBefore(node, after.nextSibling);
		}else{
		  	parent.appendChild(node);
		}
	},
	// set Data attribute to node
	// @param {HtmleElement} node
	// @param {String} field 
	// @param {String} value
	setDataValue: function(node,field,value){
		var 	attrField = 'data-' + field.replace(/([A-Z])/g,function(str,p){return '-' + p.toLowerCase();}),
				dataField = field.replace(/-(\w)/g,function(str,p){return p.toUpperCase();});	
		node.dataset[dataField] = value;
		node.setAttribute(attrField,value);
	}
	
};
// Конструктор оболочка
// @param {String} selector - css selector
// @param {Bool} getAll - true -> get all results, false -> get first item
function $0(selector,getAll){
	return document[getAll?"querySelectorAll":"querySelector"](selector);
};

// Виртуальный конструктор
var $1=function(){
	var arg = arguments[0];
	if(this instanceof $1){
		this.source=[];
		if( arg instanceof Node || arg instanceof NodeList){ // Все DOM объекты
			return this.init(arg);
		}else if(this.isString(arg)){ // Литерная константа
			return this.init($0(arg,true)); 
		}else // Остальное лесом
			throw("unknown arguments");
	}else{
		return (new $1(arg));
	}
	
};
// @memeberOf $1 - определяет строка ли входной аргумент
// @param {Object}
// @return {Bool}
$1.prototype.isString=function(obj){
	return Object.prototype.toString.call(obj) === '[object String]';
};
// @memeberOf $1 - Задача инициализировать свойство this.source ([])
// @param {Node | NodeList}
// @return {$1}
$1.prototype.init=function(){
	var arg = arguments[0];
	this.source = (arg instanceof Node) ? [arg] : Array.prototype.slice.call(arg);
	return this;
};
/*
TODO:
$1(source).bindValue(target).setValue(value)

bindValue -> registered targets as depens
setValue -> deliver onValueObservable: set value to source and update targets

Это можно использовать в определении курсов валют в депозитном калькуляторе

*/







/*
<) event 'DOMCharacterDataModified' for textNodes
<) http://js-help.net/text/obrabotca_sobitiy/model_sobytii_dom2/sobytiya_mutatsii.php - события изменения в DOM
*/


// связывает значение от одного input-а с значением dom элемента
// DONT work if set like: source.value=... !
// @param {HTMLInputElement} source - источник данных
// @param {Node} target
// @param {String} initValue
function bindByValue(source,target,initValue){
	var onChange = function(e){
		target.textContent=e.target.value;
	};
	source.addEventListener(source.onchange?"change":"input",onChange);
	if(initValue!==undefined){
		source.value=initValue;
		target.textContent=initValue; // event not fire by this 
	} 
	return onChange;
};

var MixView={
	construct:function(){
		this.root=document.createDocumentFragment();
		this.elements={}; 
	},
	proto:function(){
		this.appendInDOM=function(node){
            node.appendChild(this.root);
		};
	}
};

function Controller(view){
	if (!view)
		throw("No input arguments");
	else
		this.view=view;
}
//MixView.construct.call(App);

$xhr={
    // @member of $xhr - send post request
    // @param {String} url - request url
    // @param {String} params
    // @param {Function} onsuccess - callback
    post:function(url,params,onsuccess){
        //$m.isFunction(onsuccess) || (onsuccess=function(){});
        var urlencoded=[];
        for(var key in params){
            params.hasOwnProperty(key) && urlencoded.push(key+"="+escape(params[key]));
        }
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange=function(){
            if (xhr.readyState==4){
                if(xhr.status>199&&xhr.status<300){
                    onsuccess(xhr.responseText);
                }
            }
        };
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        xhr.send(urlencoded.join("&"));
    },
    get:function(url,params,onsuccess){
        var urlencoded=[];
        for(var key in params){
            params.hasOwnProperty(key) && urlencoded.push(key+"="+escape(params[key]));
        }
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange=function(){
            if (xhr.readyState==4){
                if(xhr.status>199&&xhr.status<300){
                    onsuccess(xhr.responseText);
                }
            }
        };
        xhr.open("GET", url, true);
        xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        xhr.send(urlencoded.join("&"));
    }

};



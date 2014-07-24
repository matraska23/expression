// Tables Tablesheet processor v9 07.04.2014 

function getStyle( elem, name ) { 
    if (elem.style && elem.style[name]) {
		return elem.style[name]; 
	}else if (document.defaultView && document.defaultView.getComputedStyle) { // Или методом W3C, если он существует 
		// 'textAlign' -> 'text-align' 
		name = name.replace(/([A-Z])/g,"-$1").toLowerCase(); 
		var s = document.defaultView.getComputedStyle(elem,""); 
		return s && s.getPropertyValue(name); 
	}else if (elem.currentStyle && elem.currentStyle[name]){ // IE fix
		return elem.currentStyle[name]; 
    } else 
       return null; 
} 

var TablesApp = (function(){
	// Заготовка для функции биндинга DOM элементов по id
	// Usage: var obj = bindById("control-",["owner-data","image","notification-image","flip-counter"]);
	// @param {String} prefix
	// @param {Array} parts
	// @param {Object} obj
	var bindById = (function(){
		var     CATCH_DEFIS = /-(\w)/g,
				_replaceDefis = function(str, p1, offset, s) {
					return p1.toUpperCase();
				};
		return function(prefix, parts,obj){
			if(!obj){
				var obj={};
			}
			for(var i=parts.length-1,field;i>=0;i--){
				field=parts[i].replace(CATCH_DEFIS,_replaceDefis);
				obj[field]=document.getElementById(prefix+parts[i]);
			}
			return obj;
		}
	}());
	
	var _alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

	function alphaIndex(numb){
		var ceil, _numb = numb, str= "";
		while( ceil = ~~(_numb/26), ceil>0){
			str += _alphabet[ceil-1];
			_numb -= ceil*26; 
		}	
		str += _alphabet[_numb];
		return str;
	}
	
	function generateSymbolIndex(length){
		var res =[];
		for(var i=0; i< length; i++){
			res.push(alphaIndex(i));
		};
		return res;
	}
	
	var 	_X_MAX = 32,
			_Y_MAX = 40,
			_SYMBOLS = generateSymbolIndex(_X_MAX);
	
	// Cell data types:
	var		_CELL_TYPE_STRING_ID 	= 1,
			_CELL_TYPE_INT_ID		= 2,
			_CELL_TYPE_FLOAT_ID		= 3,
			_CELL_TYPE_DATE_ID		= 4,
			_CELL_TYPE_BOOL_ID		= 5,
			_CELL_TYPE_FUNCTION_ID	= 6;
			
	// @param {HtmlInput} - relative input node
	// @param {Int} cellType - defined cell type id
	
	function CellEntity(node, cellType){
		this.typeId = cellType || _CELL_TYPE_STRING_ID; // DEPRICATED

		this.originalType 		= cellType || _CELL_TYPE_STRING_ID;
		this.originalValue 		= undefined;
		
		this.evaluatedValue 	= undefined;
		this.evaluatedType 		= undefined;
		
		
		this.input = node;
		this.id = node.id;
	}
	CellEntity.prototype = {
		// @memberOf CellEntity - 
		
		execute: function(engine){
			//if(this.originalType != _CELL_TYPE_FUNCTION_ID){
				//return;
			//}
			//console.log('EXECUTE');
			//console.dir(this);
			
			var value = this.originalValue;
			var code = value.trimLeft().substring(1);
			var res = engine.evaluate(code);
			this.input.value = res;
			
			this.evaluatedValue = res;
			// @TODO add Type Detect
			this.evaluatedType = _CELL_TYPE_STRING_ID;
		},
		getDisplayedValue: function(){
			
		},
		// @memberOf CellEntity - to complete Cell value edit
		recalculate: function(){
			var 	newValue = this.input.value,
					newValueT = newValue.trimLeft();
			
			if(newValueT[0] == '='){
				this.originalType = _CELL_TYPE_FUNCTION_ID;
			}
			this.originalValue = newValue;
		},
		
		getMetaData: function(){
			return {
				id: this.id,
				originalValue: this.originalValue,
				originalType: this.originalType
			};
		},
		
		/*cellCompleteEdit: function(){
			var cellItem = this.cellCollection[e.target.id];
			if(cellItem){
				//cellItem.setValue(e.target.value);
				cellItem.recalculate();
			}
			
			this.computeAll();
			this.activeCell = undefined;
		}*/
		// @IDEA maybe set App ref in argument
		initEvents: function(){
			var onFocusHandler = function(e){
				this.input.value = this.originalValue || '';
				this.activeCell = this;
			}.bind(this);
			
			var onBlurHandler = function(e){
				this.recalculate();
				TablesApp.activeCell = undefined;
				TablesApp.computeAll();
			}.bind(this);
			
			this.input.addEventListener('focus', onFocusHandler);
			this.input.addEventListener('blur', onBlurHandler);
			
		}
	};
			
			
return {
	alphaIndex: 		alphaIndex,
	controls: 			{},
	cells:				[],
	cellCollection: 	{},
	activeCell:			undefined,
	
	// @memberOf TablesApp - 
	restoreCells: function(){
		var jsonStr = window.localStorage['metaDataStore'];
		if(jsonStr){
			var res = JSON.parse(jsonStr);
			return res;
		}else{
			return {};
		}
	},
	
	// @memberOf TablesApp - save cell metaData
	saveCells: function(){
		var res = {};
		this.cells.forEach(function(cell){
			var metaData = cell.getMetaData();
			if(metaData.originalValue != undefined){
				res[cell.id] = metaData;
			}
		});
		
		window.localStorage['metaDataStore'] = JSON.stringify(res);
		
	},
	

	// @memberOf TablesApp - recalculate relative cell values
	// @param {Bool} withoutSave -  need save cell's values' after evaluations
	computeAll: function(withoutSave){

		var executableCells = this.cells.filter(function(item){
			return item.originalType == _CELL_TYPE_FUNCTION_ID;
		}).forEach(function(item){
	
			item.execute(this.exprInstance);	
			
		}.bind(this));
		
		if(!withoutSave){
			this.saveCells();
		}
		
	},


	init: function(){
		this.exprInstance = new Expression();
		
		// Add custom function `cell()` in Interpreter
		this.exprInstance.addFunction('cell', function(args){
			var cellName = args[0];
			/*console.log('cellName: %s `%s`', cellName, this.cellData[cellName]);
			if(this.cellData[cellName] != undefined ){
				
				//@TODO detect value type and parse it!
				//console.log('Value: `%s` `%s`',this.cellData[cellName],typeof(this.cellData[cellName]));
				
				return this.cellData[cellName];
			}else{
				return undefined;
			}*/
			
			var cellItem = this.cellCollection[cellName];
	
			if(cellItem){
	
				if(cellItem.originalType == _CELL_TYPE_FUNCTION_ID){
					var 	value = cellItem.evaluatedValue,
							value_f = parseFloat(value, 10);
							
					if(isNaN(value_f)){
						value_f = 0;
					}
					return value_f;
				}else{
					return cellItem.originalValue;
				}
				
			}else{
				return undefined;
			}
			
		}.bind(this));
		
		bindById("controls-",[
			"main-table", // основная таблица
			"yaxis-table", // таблица оси Y (циферная)
			"yaxis-table-wrap", // контейнер таблицы Y
			"xaxis-table",
			"xaxis-table-wrap",
		], this.controls);
		
		for(var i=0; i < _Y_MAX; i++) {
			var row = this.controls.mainTable.insertRow(-1);
			for(var j=0; j < _X_MAX; j++) {
				row.insertCell(-1).innerHTML = "<input id='"+ _SYMBOLS[j]+i +"' class='table-cell-input'/>";
			}
			var yRow = this.controls.yaxisTable.insertRow(-1);
			yRow.insertCell(-1).innerHTML = "<span class='yaxiss-cell'><span class='axiss-cell-label m3-vertical'>"+i+"</span><span class='m3-vertical-help'></span><span class='yaxis-resize'></span></span>";
			
		}
		// Generate xAxis
		var xRow = this.controls.xaxisTable.insertRow(0);
		//console.log("DRBUG");
		for(var j=0; j < _X_MAX; j++) {
			//console.log("Ins: %s",_SYMBOLS[j]);
			xRow.insertCell(-1).innerHTML = "<span class='xaxiss-cell'><span class='axiss-cell-label'>"+_SYMBOLS[j]+"</span><span class='xaxis-resize'></span></span>";
		}
		
		var 	DATA = {},
				INPUTS = [].slice.call(document.querySelectorAll(".table-cell-input")),
				_restoreCellValues = this.restoreCells();
		
		this.controls.inputs = INPUTS;
		
		console.log('_restoreCellValues');
		console.dir(_restoreCellValues);
		
		INPUTS.forEach(function(elm) {
			var _cellEntity = new CellEntity(elm); 
			
			this.cells.push(_cellEntity);
			this.cellCollection[elm.id] = _cellEntity;
			
			var restoreMetaData = _restoreCellValues[elm.id];
			if(restoreMetaData){
				elm.value = restoreMetaData.originalValue;
				_cellEntity.originalValue = restoreMetaData.originalValue;
				_cellEntity.originalType = restoreMetaData.originalType;
			}
		
			_cellEntity.initEvents();
			
			/*var getter = function() {
				var value = localStorage[elm.id] || "";
				if (value.charAt(0) == "=") {
					with (DATA){
						 return eval(value.substring(1));
						 
					}
				} else { 
					return isNaN(parseFloat(value)) ? value : parseFloat(value); 
				}
			};
			Object.defineProperty(DATA, elm.id, {get:getter});
			Object.defineProperty(DATA, elm.id.toLowerCase(), {get:getter});*/
		}.bind(this));
		
		this.computeAll();

		var onKeyPressHandler = function(e){
			if(!e || !this.activeCell){
				return;
			}
			
			// @TODO add cell behavior modes
			// 13 - Enter
			// 27 - Escape
			// 40 down
			// console.log('KeyDown %s', e.keyCode);
			
			if(e.keyCode == 13){
				
			}
			
			
			
		
		}.bind(this);
		document.addEventListener('keydown', onKeyPressHandler);
		

		var scrollWrap = document.getElementById("tables-content");
		scrollWrap.addEventListener("scroll",function(e){
			//console.log("Scroll x: %s, y: %s",e.target.scrollLeft, e.target.scrollTop);
		
			this.controls.yaxisTableWrap.scrollTop = e.target.scrollTop;
			this.controls.xaxisTableWrap.scrollLeft = e.target.scrollLeft;
		}.bind(this),false);
		//----------------------------------------------------
		// Ресайз ячеек по оси X && Y
		var 	_dragStartX = false,
				_dragStartY = false,
				_lastPageX,
				_lastPageY,
				_relCell,
				_column, // Номер колонки
				_currentWidth;// Ячейка чей размер увеличивается
				
		this.controls.xaxisTable.addEventListener("mousedown",function(e){
			var target = e.target;
			if(target.classList.contains("xaxis-resize")){
				_lastPageX = e.pageX;
				_lastPageY = e.pageY;
				//console.log("MOUSEDOWN offsetX: %s, offsetY: %s; pageX: %s, pageY: %s",e.layerX, e.layerY, e.pageX, e.pageY);
				_dragStartX = true;
				_relCell = target.parentNode;
				_column = _relCell.parentNode.cellIndex;
				_currentWidth = parseInt(getStyle(_relCell,"width"),10);
			}else{
				
			}
		}.bind(this));
		this.controls.yaxisTable.addEventListener("mousedown",function(e){
			var target = e.target;
			if(target.classList.contains("yaxis-resize")){
				_lastPageX = e.pageX;
				_lastPageY = e.pageY;
				_dragStartY = true;
				_relCell = target.parentNode;
				_column = _relCell.parentNode.parentNode.rowIndex;
				//console.log("Row: %s",_column);
				_currentWidth = parseInt(getStyle(_relCell,"height"),10);
			}else{
				
			}
		}.bind(this));
		this.controls.xaxisTable.addEventListener("dragstart",function(e){
			e.preventDefault();
		});
		// Есть определенный резон повесить ивент на body
		/*this.controls.xaxisTable.addEventListener("mousemove",function(e){
			if(!_dragStartX)
				return;
			var 	dX = e.pageX - _lastPageX,
					dY = e.pageY - _lastPageY;
			_relCell.style.width = _currentWidth + dX + "px";
		});*/
		document.body.addEventListener("mouseup",function(e){
			//console.log("MOUSEUP offsetX: %s, offsetY: %s; pageX: %s, pageY: %s",e.layerX, e.layerY, e.pageX, e.pageY);
			if(_dragStartX){
				var 	dX = e.pageX - _lastPageX;
				
				_relCell.style.width = _currentWidth + dX + "px";
				for(var i=0, len = this.controls.mainTable.rows.length, row; row = this.controls.mainTable.rows[i], i<len; i++){
					if(row.cells[_column]){
						row.cells[_column].children[0].style.width = _currentWidth + dX + "px";
					}else{
						//console.log("CELL NOT FOUND");
					}
				}
				_dragStartX = false;
			}
			if(_dragStartY){
				var		dY = e.pageY - _lastPageY,
						row =  this.controls.mainTable.rows[_column];
						
				_relCell.style.height = _currentWidth + dY + "px";
				if(row){
					for(var i=0, len = row.cells.length, cell; cell = row.cells[i], i<len; i++){
						cell.children[0].style.height = _currentWidth + dY + "px";
					}
				}else{
					//console.log("No row founded");
				}
				_dragStartY = false;
			}
		}.bind(this))
		//----------------------------------------------------
	},
};
}());

TablesApp.init();

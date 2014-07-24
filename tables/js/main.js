// depoit.calc v0.3.44 10.11.2013

var DepCalc = {};

(function(app){
	// Format string 12000 -> 12 000
	// @param String str - input string for format
	// @return String resStr - formatted string
	var numberFormat = function(str){
		str+='';
		for(var i=str.length-1, buf = '', j=1; i>=0; i--, j++){
			buf = (j%3||!i?"":" ")+str[i]+buf;
		}
		return buf;
	}
	// Get position of cursor
	function getCursor(el) { 
	  if (el.selectionStart) { 
		return el.selectionStart; 
	  } else if (document.selection) { 
		el.focus(); 
	 
		var r = document.selection.createRange(); 
		if (r == null) { 
		  return 0; 
		} 
	 
		var re = el.createTextRange(), 
			rc = re.duplicate(); 
		re.moveToBookmark(r.getBookmark()); 
		rc.setEndPoint('EndToStart', re); 
	 
		return rc.text.length; 
	  }  
	  return 0; 
	}
	// Set cursor position 
	function setCursor(node,pos){
		if(!node) return false;
		if(node.createTextRange){
			var textRange = node.createTextRange();
			textRange.collapse(true);
			textRange.moveEnd(pos);
			textRange.moveStart(pos);
			textRange.select();
			return true;
		}else if(node.setSelectionRange){
			node.setSelectionRange(pos,pos);
			return true;
		}

		return false;
	}
	
	// форматированный вод суммы
	// @param {HtmlElement} input - поле input
	var finNumberInputController = function(input){
		var		_lastOriginalLen = undefined,
				_isDel = false,
				NON_DIG_REG = /\D/g;
		
		var onKeyDown = function(e){
			//var code=e.keyCode?e.keyCode:(e.which?e.which:e.charCode);
			if(e.keyCode == 46){
				_isDel=true;
			}
		};
		var onInput=function(e){
			var 	original = e.target.value.replace(NON_DIG_REG,""),
					originalPos = getCursor(e.target),
					endClearValue = e.target.value.substring(originalPos), // выделяем хвост - фрагмент от текущей позиции курсора, до конца строки
					endLength = endClearValue.replace(NON_DIG_REG,"").length,
					newValue = numberFormat(original);

			endLength += ~~(endLength/3); // Добавляем необходимое кол-во прбелов
			// Финальная длина введенногозначения не меняется если добавляется или удаляется не числовой символ:
			if(_isDel && newValue.length == _lastOriginalLen ){
				//console.log("AA");
				endLength--;
				_isDel=false;
			}
			e.target.value = newValue;
			setCursor(e.target,newValue.length - endLength);
			_lastOriginalLen = newValue.length;
		};
		input.addEventListener("keydown",onKeyDown);
		input.addEventListener("input",onInput);
		
		return function(){
			input.removeEventListener("keydown",onKeyDown);
			input.removeEventListener("input",onInput);
		};
	};
	// форматированный вод десятичного числа
	// @param {HtmlElement} input - поле input
	var finDecimalInputController = function(input){
		/*
		 * 
		 var 	targetContent=e.target.value;
					reg=/^\d+[.,]?\d*$/g,
					content=targetContent.replace(",",".").replace(" ","");
			if(!reg.test(content)){
				e.target.value=Math.abs(parseFloat(content,10))||"";
				//e.target.value=previousText;
			}
		 * 
		 */
		 var TEST_DEC_REG = /^\d+[.,]?\d*$/;
		 var onInput = function(e){
			 var 	content = e.target.value.replace(",",".").replace(" ","");
			 if(!TEST_DEC_REG.test(content)){
				e.target.value=Math.abs(parseFloat(content,10))||"";
			}
		 };
		 input.addEventListener("input",onInput);
		 return function(){
			input.removeEventListener("input",onInput);
		};
	}
	
	
	
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
//-------------
// Менеджер представлений
var Binder2={
    master:{},
    slave:{},
    callbacks:{},
    init:function(prefix){
        var     selectorAll = prefix ? "[data-radio-view^="+prefix+"]": "[data-radio-view]",
                radios = document.querySelectorAll(selectorAll),
                views = document.querySelectorAll(prefix?"[data-view^="+prefix+"-]": "[data-view]");

        for(var i=0, len=views.length, buf, viewName; buf=views[i], i<len; i++){
            viewName=escape(buf.dataset.view);
            if(this.slave[viewName]){
               this.slave[viewName].push(buf);
            }else{
               this.slave[viewName]=[buf];
            }

        }
        for(var i=0, len=radios.length, buf, radioName; buf=radios[i], i<len; i++){
            radioName=escape(buf.dataset.radioView);
            if(this.master[radioName]){
                this.master[radioName].push(buf);
            }else{
                this.master[radioName]=[buf];
            }
        }
    },
    turnOn:function(self){
        var viewName = self.dataset.radioView;
        this.callView(viewName);
    },
    callView:function(viewName){
        var callback = this.callbacks[viewName];
        if(callback && callback.call){
            callback.call(this,viewName);
        }else{
            console.log("Nothing to do!");
        }
    },
    onRadio:function(viewName,callback){
       this.callbacks[viewName] = callback;
    }
};
//-------------
	
	
	

	
	// Start method
	app.init=function(){
		console.log("Run DepCalc");
		this.controls = bindById("dc-controls-",[
			"sum",
			"fix-percent", // фиксированная процентная ставка
			"dp-end-float", // выбор даты - конец срока вклада
			"dp-start-float", // выбор даты - начало срока вклада
			"dp-select-srok", // выбор даты - дата начала у списка с фиксированной суммой
		]);
		
		w = finNumberInputController(this.controls.sum);
		d = finDecimalInputController(this.controls.fixPercent);
		//w=  new FinNumberInputController(this.controls.sum); 
		
		// @TODO Сделать перключалкувьюшек!
		Binder2.init("dc-");
		Binder2.onRadio("dc-fix-percent-rate",function(viewName){
			//$(this.slave["admin-ms"]).hide();
			//$(this.slave[viewName]).show();
		});
		Binder2.onRadio("dc-float-percent-rate",function(viewName){
			//$(this.slave["admin-show-ms"]).hide();
			//$(this.slave["admin-tickets"]).hide();
			//$(this.slave[viewName]).show();
			//TicketAdminApp.troubleList.init();
		});
		
		var dpStartFloat = new DCDatePicker(this.controls.dpStartFloat); 
		var dpEndFloat = new DCDatePicker(this.controls.dpEndFloat); 
		var dpStartList = new DCDatePicker(this.controls.dpSelectSrok); 
		
	};
}(DepCalc));

DepCalc.init();


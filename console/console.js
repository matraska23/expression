// Dev console
var 	evaluateBtn = $4.id('devcon-eval-btn'),
		expressionTextBox = $4.id('devcon-expression-textbox'),
		resContainer = $4.id('devcon-res'),
		helpPopWrapper = $4.id('devcon-help'),
		helpBtn = $4.id('devcon-help-btn'),
		helpCloseBtn = $4.id('devcon-help-close-btn');
		
var 	HistoryNavigate	= {
			historyStack: [],
			historyIndex: 0,
			
			// HistoryNavigate.next()
			next: function(){
				var 	nextStep = this.historyIndex + 1;
				
				if(this.historyStack[nextStep]){
					this.historyIndex = nextStep;
					return this.historyStack[this.historyIndex];
				}
			},
			prev: function(){
				var 	prevStep = this.historyIndex - 1;
				
				if(this.historyStack[prevStep]){
					this.historyIndex = prevStep;
					return this.historyStack[this.historyIndex];
				}
			},
			// @param {String} code
			save: function(code){
				this.historyStack.push(code);
				this.historyIndex = this.historyStack.length;
			}
};
//var aCur = new Arifmethic2Cursor();	
var exprInstance = new Expression();	

exprInstance.addFunction('array', function(args){
	return args;
});

exprInstance.addFunction('summ', function(args){
	var 	summ = 0,
			array = args[0];
			
	if(Array.isArray(array)){
		args[0].forEach(function(item){
			summ += item;
		});
	}else{
		summ = undefined;
	}
	
	return summ;
});

// 'map(array(1, 2, 3, 4), {x| x^2})',
// 'map(array(1, 2, 3, 4), sin)',
exprInstance.addFunction('map', function(args){
	var 	array = args[0],
			lamdaName = args[1],
			res = [],
			lamdaClojure = {}, // custom clojure also supported!
			buf;
			
	if(Array.isArray(array) && this.isExecutable(lamdaName)){
		array.forEach(function(item){
			buf = this.methodExecution(lamdaName, [item], lamdaClojure);
			res.push(buf);
		}.bind(this));
	}else{
		res = undefined;
	}
	
	return res;
});


var evaluateCode = function(){

	var 	code = expressionTextBox.value,
			res = exprInstance.evaluate(code),
			warnings = '';
	
	var 	resBody = '<div class="expr-row"><span class="output-c1">Expr:</span> `'+code+'`</div>' + 
	'<div class="expr-row"><span class="output-c2">Ans:</span> ' + res + '</div>';
	exprInstance.setVariable('ans', res);
	
	if(exprInstance.cursor.warningStack.length){
		warnings = exprInstance.cursor.warningStack.join("<br/>");
		resBody += '<div>Warnings:</div>';
		resBody += '<div>' + warnings + '</div>';
	}
	
	var resNode = $4.cr("div", "innerHTML", resBody, 'className', 'output-container');
	resContainer.appendChild(resNode);
	expressionTextBox.value = "";	
	
	HistoryNavigate.save(code);
};
//
document.addEventListener('keydown', function(e){

	if(e.srcElement == expressionTextBox){
		switch(e.keyCode){
			case 13:
				e.preventDefault();
				evaluateCode();
			break;
			case 38:
				var prevCode = HistoryNavigate.prev();
				expressionTextBox.value = prevCode;
			break;
			case 40:
				var nextCode = HistoryNavigate.next();
				expressionTextBox.value = nextCode;
			break;
		}
	}
});
evaluateBtn.addEventListener('click', function(e){
	evaluateCode();
});
helpBtn.addEventListener('click', function(e){
	helpPopWrapper.style.display = '';
});
helpCloseBtn.addEventListener('click', function(e){
	helpPopWrapper.style.display = 'none';
});
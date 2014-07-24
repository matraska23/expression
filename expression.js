// Expression v42 28/04/2014
// Noname script language engine, smart algebraic expression evaluator
// (C) copyright 2013, 2014 Malcev N.

// - dinamic variable/constants binding
// - custom functions on javascript and lamda
//		(support of arrays)
// - operations under float numbers and strings,
// - boolean operations <=, >=, ==, !=, >, <, ||, &&
// - arithmetic operations +, -, *, /, %, ^
// syntax sugar `$`

// for IE8 => 
// String.prototype.trim()
// Array.prototype.indexOf

//----------------------------------------------------------------------
// @TODO
// 1) Public frontend
// 2) For failed calculations return NaN


//-------------------
var 	CONSTANTS = {
			pi:		 	Math.PI,
			e:			Math.E,
			"true":	 	true,
			"false": 	false,
			"null": 	undefined
		},
		OPER = { // precedence of the operators
			'>': 	2,
			'<': 	2,
			'==': 	2,
			'!=': 	2,
			'||': 	1,
			'>=': 	2,
			'<=':	2,
			'&&':	1,
			'+':	3,
			'-':	3,
			'*':	4,
			'/':	4,
			'%':	4,
			'^':	5,
		};	

var 	FUCTIONS 		= ["sin", "cos", "tan", "log", "max", "min", "abs", "length", "not", "call", "var"], // predefined function names
		IS_DIGITAL 		= /^[\+\-]?\d+(\.\d*)?$/,
		IS_STRING 		= /^(?:"[\s\S]*"|'[\s\S]*')$/,
		SPLIT_REG 		= /("[\s\S]*"|'[\s\S]*'|\+|\-|\*|\/|\(|\)|\%|\^|\,|<=|>=|==|<|>|\|\||&&|\||\{|\}|\?|\:|\$)/g,
		IS_VAR 			= /^[a-zA-Z\$\_][\w\d\_$#]*$/,
		IS_LAMDA_INDEX 	= /^\$\d+$/,
		IS_SHORT_LITER 	= /^\@[\w\d\_$]+$/,
		_last_func;
		
var 	_acIndex = 0;

// notUseRecursion - опция копирования свойств объекта без использования рекурсии (сохраняются ссылки).
// Полное копирование объекта события в IE это его смерть от выхода за пределы памяти.
// Поэтому есть смысл его отключить
function clone(o, notUseRecursion) {// Out of the memory in IE8
	if(!o || 'object' !== typeof o)  return o;
	var 	c = 'function' === typeof o.pop ? [] : {},
			p, v;
	for(p in o) {
		if (Object.prototype.hasOwnProperty.call(o, p)){ // o.hasOwnProperty(p) Dont supported in IE8
			v = o[p];
			c[p] = (v && 'object' === typeof v && !notUseRecursion) ? clone(v) : v;
		}
	} 
	return c;
}
function mergeArray(array1, array2){
	for(var i = 0, len = array2.length; i < len; i++){
		array1.push(array2[i]);
	}
}

// Private backend:
function Arifmethic3Cursor(){
	this.parts = [];
	this.variables = {};
	this.warningStack = [];
	this.lamdaIndex = [];
	this.stopEvaluate = false; //флаг для остановки преобразований
	this.aci = _acIndex++;
	this.customFunctions = {};
};

Arifmethic3Cursor.prototype = {
	// @memberOf Arifmethic2Cursor - prepare expresion for parsing
	// @return {Bool} successStatus
	prepare: function(exp){
		var 	parts = exp.split(SPLIT_REG),
				i = 0, 
				closeBrackets = 0, // for close brackets for '$' compensations
				buf, prev, 
				len = parts.length;
		
		// To make code beutiful you need to create standalone parse object from prepare() method
		// where i, parts, closeBrackets would be fields of object
		
		// helper for parsing lamda, working in contest of prepare() method
		// {Array} $LIndex
		var parseLamda2 = function($LIndex){
			//console.log('PARSE LAmda [%s - %s]',i, len);
			var 	lambdaContent = [],
					argumentNames = [],
					closeBrackets = 0,
					buf, prev, warning;

			//console.log("LPARTS. i: %s",i);
			//console.dir(parts);
			for(; i < len; i += 2){
				//console.log("\t Circle: i: %s `%s`%s` buf: %s",i,parts[i],parts[i+1]);
				if(parts[i+1] != "|" && parts[i+1] != ","){
					break;
				}else{
					buf = parts[i] && parts[i].trim();
					buf && argumentNames.push(buf);
				}
			}
			//console.log('DEBUG bif: `%s` , i: %s, len: %s',buf, i,len);
			//console.dir(parts);
			while(
				buf != '}' && i < len
			){
				if(buf = parts[i].trim()){
					if(
						OPER[buf] && (prev == undefined || prev == "(" || prev == "," || prev == "?" || prev == ":" || OPER[prev]) 
					){
						if(buf == "-" ){
							lambdaContent.push("-1");
							lambdaContent.push("*");
							//continue;
						}else if(buf !='+'){
							//console.log("prev: `%s`, `%s` i: %s ",prev,buf, i);
							//console.dir(lambdaContent);
							//throw("Double operations! "+i );
							warning = "Incorrect operator use in p: " + parts.length + ", `" + (prev || "") + buf  + "`";
						}
						//console.log("digitalSign: `%s` %s",digitalSign,i );
					}else if(buf == '{' ){
						i++;
						//console.log('Sub LAmda `%s` [%s - %s]',i, i, len);
						lambdaContent.push('$' + $LIndex.length);
						$LIndex.push(parseLamda2($LIndex));
					}else if(buf != '}' ){
						if(buf == '$'){ // test if '$0' or change Symbol!
							buf = '(';
							closeBrackets++;
						}
						lambdaContent.push(buf);
						prev = buf;
					}
				}
				i++;
			}
			
			for(var j = 0; j < closeBrackets; j++){
				lambdaContent.push(')');
			}
			
			return {
				names: argumentNames,
				content: lambdaContent,
				lamdaIndex: $LIndex,
				warning: warning
			}; 
		};	
			
		while(i < len){
			if(buf = parts[i].trim()){
				if(
					OPER[buf] && (prev == undefined || prev == "(" || prev == "," || prev == ":" || prev == "?" || OPER[prev]) 
				){
					if(buf == "-"){
						this.parts.push("-1");
						this.parts.push("*");
					}else if(buf !='+'){
						this.warningStack.push("Uncorrect oparator use in p: " + this.parts.length + ", `" + (prev || "") + buf  +"`");
						return false;
					}
					//console.log("digitalSign: `%s` %s",digitalSign,i );
				}else if(buf == "{"){
					i++;
					var instance = parseLamda2(this.lamdaIndex);
					this.parts.push('$' + this.lamdaIndex.length);
					this.lamdaIndex.push(instance);
					if(instance.warning){ //collect warnings after lamda pars
						this.warningStack.push(instance.warning);
						return false;
					}
				}else{
					//console.log("N: %s `%s`",i,buf);
					if(buf == '$'){ // test if '$0' or change Symbol!
						buf = '(';
						closeBrackets++;
					}
					this.parts.push(buf);
					prev = buf;
				}
			}
			i++;
		}
		for(var i = 0; i < closeBrackets; i++){
			this.parts.push(')');
		}
		
		this.len = this.parts.length;
		this.pos = 0;
		// console.log("\tParts");
		// console.dir(this.parts);
		// console.dir(parts);
		// console.dir(this.lamdaIndex);
		return true;
	},
	
	setVariables: function(obj){
		this.variables = obj;
	},
	// @TODO skip expresion evaluation (for `lazy` arguments)
	skipEvaluation: function(){
		var 	brCount = 0,
				liter;
		while(
			 this.pos < this.len
		){
			liter = this.parts[this.pos];
			if(liter =='('){
				brCount++;
			}else if(liter == ')'){
				brCount--;
			}
			
			liter = this.parts[++this.pos];
			if( !brCount && (liter == "," || liter == ":" || liter == ")") )
				break;
		}
	},
	// @memberOf Arifmethic2Cursor - evaluate ternar operator
	condit : function(success){
		var result = this.logical();
		
		if(this.parts[this.pos] == '?'){
			this.pos++;
			if(result){
				result = this.logical();
				if(this.parts[this.pos] == ':'){
					this.pos++;
					// skip
					this.skipEvaluation();
				}
			}else{
				// skip
				this.skipEvaluation();
				if(this.parts[this.pos] == ':'){
					this.pos++;
					result = this.logical();
				}
			}
		}	
		return result;
	},
	// @memberOf Arifmethic2Cursor - evaluate &&, ||
	logical : function(){
		var 	result = this.bool(),
				buf;
		while( 
			OPER[this.parts[this.pos]] == 1 && this.pos < this.len 
		){
			switch(this.parts[this.pos]){
				case "||" : 
					this.pos++; 
					buf = this.bool(); // separate because can cause troubles (JS specific)
					result = result || buf; 
					break;
				case "&&" : 
					this.pos++; 
					buf = this.bool();
					result = result && buf; 
					break;
			}
		}
		return result;
	},
	bool : function(){
		var 	result = this.expression(),
				liter = this.parts[this.pos];
		while( 
			OPER[liter] == 2 && this.pos < this.len 
		){
			this.pos++; 
			switch(liter){
				case "==" : 
					result = result == this.expression(); 
					break;
				case "<" : 
					result = result < this.expression(); 
					break;
				case ">" : 
					result = result > this.expression(); 
					break;
				case ">=" : 
					result = result >= this.expression(); 
					break;
				case "<=" : 
					result = result <= this.expression(); 
					break;
			}
			liter = this.parts[this.pos];
		}
		return result;
	},
	expression : function(){ //  +|-
		var 	result = this.component(),
				liter;
		while( liter = this.parts[this.pos], OPER[liter] == 3  && this.pos < this.len){
			//console.log("p: `%s`",this.parts[this.pos])
			if(liter == "+"){
				this.pos++;
				result += this.component();
			}else if(liter == "-"){
				this.pos++;
				result -= this.component();
			}else if(liter == ")" || liter == ","){
				break;
			}
		}
		return result;
	},
	component : function(){ // *|/|%
		var result = this.element();
		while( OPER[this.parts[this.pos]] == 4  && this.pos < this.len){
			switch(this.parts[this.pos]){
				case "*" : 
					this.pos++; 
					result *= this.element(); 
					break;
				case "/" : 
					this.pos++; 
					result /= this.element(); 
					break;
				case "%" : 
					this.pos++; 
					result %= this.element(); 
					break;
			}
		}
		return result;
	},
	element : function(){ // ^
		var result = this.factor();
		while( this.parts[this.pos] == "^" && this.pos < this.len ){
			this.pos++;
			result = Math.pow(result, this.factor());
		}
		return result;
	},
	factor : function(){
		var 	result =0,
				liter = this.parts[this.pos];
		
		//console.log("\t Factor %s `%s`",this.pos,this.parts[this.pos]);
		// @TODO move it in another method (function/lamda name set in arguments) - уменьшим условия логического ветвления в коде
		if(IS_VAR.test(liter) ){
			//console.log("FACTOR METHOD OR VAR");
			this.pos++;
			if(this.parts[this.pos] == "("){ // method/lamda execution && catch arguments
				//console.log("FACTOR ARGUMENTS");
				result = this.executeFunction(liter);
			}else{ // get variable value
				var val = CONSTANTS[liter] != undefined ? CONSTANTS[liter] : this.variables[liter] != undefined ? this.variables[liter] : undefined;
				//if(liter && (liter[0] == "$" || FUCTIONS.indexOf(liter) != -1)){
				if(liter && this.isExecutable(liter)){
					result = liter;
				}else{
					result = val;
				}
			}
		}else if(liter=="("){
			this.pos++;
			result = this.condit();
			
			if(this.parts[this.pos] != ")"){
				this.stopEvaluation("Missing ')' in position " +  this.pos + ".")
			}
			this.pos++;
			//console.log("SCOPE complited: p:%s `%s`", this.pos, this.parts[this.pos]);
			// @TODO вынести в отдельный метод проверку на возможность вызова результата
			//if(typeof(result)=="string" && (result[0]=="$" || FUCTIONS.indexOf(result) != -1) && this.parts[this.pos]=="("){ // CHECK IF try execute result
			if(typeof(result) == "string" && this.isExecutable(result) && this.parts[this.pos]=="("){ // CHECK IF try execute result
				//console.log("CONTINUE LAMDA %s `%s`",this.pos, this.parts[this.pos]);
				result = this.executeFunction(result);
			}
		}else{
			console.log("FACTOR NUMBER");
			result = this.number();
		}
		//---------------------
		return result;
	},
	execArg : function(pos){
		var 	cachePos = this.pos,
				subResult;
				
		this.pos = pos;
		subResult = this.condit();
		this.pos = cachePos;
		return subResult;
	},
	// detect if function Name is executable
	isExecutable : function(fname){
		return FUCTIONS.indexOf(fname) != -1 || fname[0] == "$" || (this.customFunctions[fname] && this.customFunctions[fname].call);
	},
	// Выполнение функции - стадия определения значения аргументов
	// @param {Object} closure - клнтекст (замыкание)
	executeFunction: function(fname, clojure){
		//if(FUCTIONS.indexOf(fname) == -1 && fname[0] != "$"){
		if(!this.isExecutable(fname)){
			this.stopEvaluation("Unknown function construction: "+this.pos+ " `"+ fname +"`");
		}
		if(fname != 'call'){ 
			_last_func = fname;
		}
		this.pos++;
		// Collect arguments
		var 	args = [],
				argresult = 0,
				arg;
		
		while(this.parts[this.pos] != ")" && this.pos < this.len ){
			arg = this.condit();
			args.push(arg);
			if(this.parts[this.pos] ==','){
				this.pos++;
			}
		}
		this.pos++;
		
		 //console.log("Execute Functions: %s (%s)",fname, JSON.stringify(clojure));
		// console.dir(args);
		return this.methodExecution(fname, args, clojure );
	},
	// computation result of function
	// Выполнение метода - стадия вычисления
	methodExecution : function(fname, args, clojure){
		//console.log("\tComplirted args");
		//console.dir(args);
		
		console.log("Call `%s`", fname);
		
		var 	result, 
				cacheLamdaVariables;
		
		if(fname[0] == "$"){ // Lamda
			var 	lamdaName = fname.substring(1),
					lamdaData = this.lamdaIndex[lamdaName],
					argNames = lamdaData.names,
					engine = new Arifmethic3Cursor();
			
			engine.parts = lamdaData.content;
			engine.len = engine.parts.length;
			engine.lamdaIndex = lamdaData.lamdaIndex;
			engine.variables = clone(clojure || this.variables, true); // Чтобы избежать изменения по ссылке
					
			//console.log(" DETECT Lamda Index: %s p: %s", lamdaName, this.pos);
			//console.dir(args);
			for(var i = 0, len = argNames.length; i < len; i++){
				engine.variables[argNames[i]] = args[i];
			}
			//console.log("this.variables `%s`, engine", JSON.stringify(this.variables), JSON.stringify(engine.variables));
			//console.log("this.aci %s, engine.aci %s",this.aci, engine.aci);
			
			engine.pos = 0;
			result = engine.condit();
			
			mergeArray(this.warningStack, engine.warningStack);
			
			cacheLamdaVariables = engine.variables;
		}else if(FUCTIONS.indexOf(fname) != -1 ){ // predefined functions
			switch(fname){
				case "sin": result = Math.sin(args[0]); break;
				case "cos": result = Math.cos(args[0]); break;
				case "tan": result = Math.tan(args[0]); break;
				case "log": result = Math.log(args[0])/Math.log(args[1]); break;
				case "min": result = Math.min(args[0], args[1]); break;
				case "max": result = Math.max(args[0], args[1]); break;
				case "abs": result = Math.abs(args[0]); break;
				case "length": result = (args[0] + '').length; break;
				case "not": result = !args[0]; break;
				case "call":
					//console.log("EXEC CALL `%s` [%s]",_last_func, args[0] );	
					//console.dir(args);
					result = this.methodExecution(_last_func, args);
					break;
				case "var":
					this.variables[args[0]] = args[1];
					result = args[1];
					break;
			}
		}else if(this.customFunctions[fname]){ // call user defined functions
			result = (this.customFunctions[fname].bind(this))(args);
		}
		
		if(typeof(result) == "string" && this.isExecutable(result) && this.parts[this.pos] == "("){
			//console.log("Execute Child Lamda %s `%s`", result,JSON.stringify(cacheLamdaVariables));
			result = this.executeFunction(result, cacheLamdaVariables);
		}
		
		return result;
	},
	number: function(){
		var 	result = 0,
				liter = this.parts[this.pos];
				
		if(IS_DIGITAL.test(liter)){
			result = parseFloat(liter,10);
		}else if(IS_STRING.test(liter)){
			result = liter.substring(1, liter.length-  1);
		}else if(IS_SHORT_LITER.test(liter)){ // transform  `@abc -> "abc"`
			result = liter.substring(1);
		}else{
			this.stopEvaluation('Unknown value or empty symbol: ' + this.pos + ' `'+liter+'`');
		}
		this.pos++;
		return result;
	},
	stopEvaluation:function(mes){
		this.warningStack.push(mes);
		this.pos = this.len; // способ закончить выполнение без эксепшенов
	}
};

// public frontend:
function Expression(){
	this.cursor = new Arifmethic3Cursor();
}
Expression.prototype = {
	evaluate : function(newExp){
		var res;
		this.cursor.parts = [];
		this.cursor.warningStack.length = 0;
		this.cursor.stopEvaluate = false;
		this.cursor.pos = 0;
		var prepareRes = this.cursor.prepare(newExp);
		if(prepareRes){
			res = this.cursor.condit();
		}else{
			res = NaN;
		}
		return res;
	},
	setVariable : function(variable,value){
		this.cursor.variables[variable]=value;
	},
	getValue : function(variable){
		return this.cursor.variables[variable];
	},
	variableExists : function(variable){
		return variable in this.cursor.variables;
	},
	// @param {String} fname
	// @param {Function} cb
	addFunction: function(fname, cb){
		if(FUCTIONS.indexOf(fname) == -1){
			this.cursor.customFunctions[fname] = cb;
		}
	}
};

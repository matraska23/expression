// Arifmethic2 v2 01/12/2013 based on algoritm https://github.com/lipeavelar/Parser
// smart algebraic parser/calculator
// (C) copyright 2013 Malcev N.

// - dinamic variable/constants binding
// - operations under float numbers and strings
// - operations +,-,*,/,%,^

// String.prototype.trim()
// IE8 => Array.prototype.indexOf

//----------------------------------------------------------------------
// @TODO
// 1) public frontend
// 2) Bool operations
// <=, >=, ==, !=, >, <, ||, &&
// 3) error throwing change on operation status!
// 4) make unlimited number of arguments in functions
//----------------------------------------------------------------------

// @TODO CHECK in FRONTEND
var RESERVED_NAMES = [	//Operations or maybe unused
	"sin",
	"cos",
	"tan",
	"log",
	"min",
	"max",
	"abs",
	//constants
	"pi",
	"e"
];
//Constants
var CONSTANTS = {
	pi : Math.PI,
	e : Math.E
};

var 	FUCTIONS = ["sin", "cos", "tan","log","max","min","abs","incr"],
		IS_DIGITAL = /^\d+(.\d*)?$/,
		IS_STRING = /^(?:"[\s\S]+"|'[\s\S]+')$/,
		SPLIT_REG = /(\+|\-|\*|\/|\(|\)|\%|\^|\,)/g;

// Private backend:
function Arifmethic2Cursor(exp){
	var parts = exp.split(SPLIT_REG);
	this.parts = [];
	this.variables = {};
	for(var i=0, len = parts.length, buf;i<len; i++){
		
		if(buf= parts[i].trim()){
			this.parts.push(buf);
		}
	}
	//console.log("Parts");
	//console.dir(this.parts);
	this.len = this.parts.length;
	this.pos = 0;
}
Arifmethic2Cursor.prototype={
	setVariables : function(obj){
		this.variables = obj;
	},
	expression : function(){ //  +|-
		var result = 0;
		result = this.component();
		//console.log("START: %s `%s`",this.pos,this.parts[this.pos]);
		while(
			//this.pos < this.len
			(
				this.parts[this.pos] == "-" ||
				this.parts[this.pos] == "+" 
			) &&
				this.pos < this.len
		){
			//console.log("p: `%s`",this.parts[this.pos])
			if(this.parts[this.pos] == "+"){
				this.pos++;
				result += this.component();
			}else if(this.parts[this.pos] == "-"){
				//console.log("m- `%s`",this.pos);
				this.pos++;
				result -= this.component();
			}else if(this.parts[this.pos] == ")"||this.parts[this.pos]==","){
				break;
			}
		}
		return result;
	},
	component : function(){ // *|/|%
		var result =0;
		result = this.element();
		while(
			(
				this.parts[this.pos] == "*" ||
				this.parts[this.pos] == "/" ||
				this.parts[this.pos] == "%" 
			) &&
				this.pos < this.len
		){
			switch(this.parts[this.pos]){
				case "*" : this.pos++; result *= this.element(); break;
				case "/" : this.pos++; result /= this.element(); break;
				case "%" : this.pos++; result %= this.element(); break;
			}
			
		}
		return result;
	},
	element : function(exp){ // ^
		var result = 0;
		result = this.factor();
		while(
			this.parts[this.pos] == "^" && this.pos < this.len
		){
			if(this.parts[this.pos] == '^'){
				this.pos++;
				result = Math.pow(result,this.factor());
			}
		}
		return result;
	},
	factor : function(){
		var 	result =0;
		var 	bracketOpenPos = this.parts.indexOf("(",this.pos); // -1 if not found!
		//console.log("bracketOpenPos: %s, pos:%s",bracketOpenPos,this.pos);
		if(bracketOpenPos == this.pos){ // Open `(...`
			//console.log("\tFACT #1");
			this.pos++;
			result = this.expression();
			if(this.parts[this.pos] != ")") 
				throw "Missing ')' in position " +  this.pos + ".";
			this.pos++;
		}else if(bracketOpenPos > this.pos){ // Find `...(`
			
			var 	fName  = this.parts[this.pos];
			//console.log("\tFACT #2 `%s`", fName);
			if(FUCTIONS.indexOf(fName) > -1){ // if it is Function
				
				this.pos = bracketOpenPos+1;
				//console.log("\tFACT #2! `%s`, pos: %s, `%s`", fName,this.pos, this.parts[this.pos]);
				var 	num1, num2;
				var 	verifyNum2 = false;
				num1 = this.expression();
				if(this.parts[this.pos] == ","){
					this.pos++;
					verifyNum2 = true;
					num2 = this.expression();
				}
				if(this.parts[this.pos] != ")") 
					throw "Missing ')' in position "+this.pos+".";
				this.pos++;

				switch(fName){
					case "sin": result = Math.sin(num1); break;
					case "cos": result = Math.cos(num1); break;
					case "tan": result = Math.tan(num1); break;
					case "log": result = Math.log(num1)/Math.log(num2); break;
					case "min": result = Math.min(num1,num2); break;
					case "max": result = Math.max(num1,num2); break;
					case "abs": result = Math.abs(num1); break;
					case "incr": result = num1+1; break; // test Function!
				}
			}else{
				//console.log("\tFACT #3");
				result = this.number();
			}
		}else{
			//console.log("\tFACT #4");
			result = this.number();
		}
		return result;
	},
	number : function(){
		var result = 0;
		if((
			IS_DIGITAL.test(this.parts[this.pos-1] ) ||
			this.parts[this.pos-1] == ')' ||
			this.parts[this.pos-1] == '('
		) && (
			this.parts[this.pos] == '-' ||
			this.parts[this.pos] == '+'
		)){
			this.pos++;
		}
		var _str = this.parts[this.pos];
		//console.log("POS `%s`",this.pos);
		if(IS_DIGITAL.test(_str)){
			result = _str;
			this.pos++;
			//console.log("num: `%s`",result);
			result = parseFloat(result);
		}else{
			//console.log("Found: `%s`",_str);
			var constValue = CONSTANTS[_str];
			if(constValue){
				//console.log("BUF ok: `%s`",constValue);
				result = constValue;
				this.pos++;
			}else if(IS_STRING.test(_str)){
				result = _str.substring(1, _str.length-1);
				//console.log("Is String: `%s`",result);
				this.pos++;
			}else{
				var variableValue = this.variables[_str];
				if(variableValue){
					result = variableValue;
					this.pos++;
					//console.log("Is variable: `%s`, `%s`",result);
				}
			}
		}
		
		return result;
	}
};

// public frontend:
function Arifmethic2(expression){
	this.expression = expression;
}
Arifmethic2.prototype = {
	evaluate : function(){
		
	},
	changeExpression : function(){
		
	},
	setVariable : function(){
		
	},
	getValue : function(){
		
	},
	variableExists : function(){
		// return variable in this.variableValues;
	}
};

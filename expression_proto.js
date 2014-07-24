var 	IS_DIGITAL = /^[\+\-]?\d+(.\d*)?$/,
		IS_STRING = /^(?:"[\s\S]+"|'[\s\S]+')$/,
		SPLIT_REG = /(\+|\-|\*|\/|\(|\)|\%|\^|\,|<=|>=|==|<|>|\|\||&&|\||\{|\})/g;
		
var varName = /^[\w\$][\w\d\_$]+$/;
		
var OPER = {
	'+':1,
	'-':1,
	'*':2,
	'/':2,
	'%':2,
	'^':3,
}


function ExpresionEngine(){
	this.lamdaIndex = [];
	this.parts = [];
	this.pos = 0;
	this.variables = [];
}
ExpresionEngine.prototype = {
	parser : function(exp){
		var 	parts = exp.split(SPLIT_REG),
				i = 0, buf;
		
		var parseLamda = function(){
			var 	lambdaContent = [],
					argumentNames = [],
					buf;
			for(; buf= parts[i].trim(), buf!="|" && i< parts.length; i++){
				if(buf && buf != ","){
					argumentNames.push(buf);
				}
			}
			i++;
			for(var brackCount=0; i< parts.length; i++){
				if(buf= parts[i].trim()){
					if(buf=="{"){
						brackCount++;
					}
					if(buf=="}"){
						brackCount--;
					}
					if(brackCount<0){
						break;
					}else{
						lambdaContent.push(buf);
					}
				}
			}
			return {
				names: argumentNames,
				engine: lambdaContent
			};
		};
		var prev, digitalSign;
		while(i<parts.length){
			if(buf = parts[i].trim()){
				// Это можно использоваьть с тем, чтобы ловить такие ошибки  как 2^^4 или 2--1
				// Надо часть условия переделатьво во вложенное!!
				if(
					(buf == "-" || buf =='+') && (prev=="(" || OPER[prev]) 
				){
					digitalSign = buf;
					//console.log("digitalSign: `%s` %s",digitalSign,i );
				}else if(buf=="{"){
					i++;
					//console.log("[ %s", i);
					this.parts.push('$' + this.length);
					this.lamdaIndex.push(parseLamda());
					//console.log("%s]", i);
				}else{
					if(digitalSign){
						buf = digitalSign + buf;
						digitalSign = undefined;
					}
					//console.log("N: %s `%s`",i,buf);
					this.parts.push(buf);
					prev = buf;
				}
			}
			i++;
		}
		
		// this.len = this.parts.length;
		// this.pos = 0;
		console.log("Parser data:");
		console.dir(this.parts);
		console.dir(this.lamdaIndex);
		this.len = this.parts.length;
	},
	subExpresionParser : function(level){
		console.log("INIT: %s l: %s, `%s`",this.pos,level, this.parts[this.pos]);
		var liter;
		var result = 0;
		var buf;
		while(this.pos < this.len){
			liter = this.parts[this.pos];
			if(liter==")"){
				break;
			}
			//console.log("%s L%s `%s`",this.pos,level,liter);
			
			if(liter == "("){
				console.log("OPEN: %s, %s",this.pos,this.parts[this.pos]);
				/*this.pos++;
				
				var subResult = this.subExpresionParser(level+1);
				// if subResult callAble - save link on function
				console.log("\tsubResult: %s",subResult);
				//result += subResult;
				this.pos++;*/
			}else{
				//console.log("\tI: %s, `%s`", this.pos,liter);
				//this.cursor(liter,buf);
				//--------------------------------------
				console.log("SYMB: %s, buf: `%s`",liter,buf);
				buf = liter;
				//this.pos++;
				
				result = this.level1_1();
				console.log("\tR: %s", result);
				//----------------------------------
			}
			//this.pos++;
			
		}
		return result;
	},
	cursor: function(symbol,buf){
		console.log("SYMB: %s, buf: `%s`",symbol,buf);
		buf = symbol;
		
	},
	level1_1: function(res){
		var result = res||this.symbol();
		//console.log("START: %s `%s`",this.pos,this.parts[this.pos]);
		while(
			//this.pos < this.len
			(
				this.parts[this.pos] == "-" ||
				this.parts[this.pos] == "+" 
			) &&
				this.pos < this.len
		){
			console.log("L1: `%s`",this.parts[this.pos])
			if(this.parts[this.pos] == "+"){
				
				this.pos++;
				var next = this.parts[this.pos];
				console.log("NEXT: %s",next);
				if(next!= "("){
					result += this.symbol();
				}else{
					this.pos++;
					var subResult = this.subExpresionParser(1);
					this.pos++;
					result += subResult;
					console.log("EXPRESION in Brackets %s, '%s' subResult: %s", this.pos, this.parts[this.pos],subResult);
				}
				
			}else if(this.parts[this.pos] == "-"){
				this.pos++;
				var next = this.parts[this.pos];
				console.log("NEXT: %s",next);
				if(next!= "("){
					result -= this.symbol();
				}else{
					this.pos++;
					var subResult = this.subExpresionParser(1);
					this.pos++;
					result -= subResult;
					console.log("EXPRESION in Brackets %s, '%s' subResult: %s", this.pos, this.parts[this.pos],subResult);
				}
			}else {//if(this.parts[this.pos] == ")"||this.parts[this.pos]==","){
				console.log("?");
				break;
			}
		}
		return result;
	},
	level1: function(res){
		var result = res||this.factor();
		//console.log("START: %s `%s`",this.pos,this.parts[this.pos]);
		while(
			//this.pos < this.len
			(
				this.parts[this.pos] == "-" ||
				this.parts[this.pos] == "+" 
			) &&
				this.pos < this.len
		){
			console.log("L1: `%s`",this.parts[this.pos])
			if(this.parts[this.pos] == "+"){
				
				this.pos++;
				result += this.factor();
			}else if(this.parts[this.pos] == "-"){
				this.pos++;
				result -= this.factor();
			}else if(this.parts[this.pos] == ")"||this.parts[this.pos]==","){
				console.log("?");
				break;
			}
		}
		return result;
	},
	symbol: function(){
		console.log("SYMB: `%s`,",this.parts[this.pos]);
		var 	result,
				liter = this.parts[this.pos];
		if(IS_DIGITAL.test(liter)){
			result = parseFloat(liter,10);
			this.pos++;
		}else{
			throw("Unknown symbol `%s`",liter);
		}
		
		return result;
	},
	factor: function(){
		var 	result,
				liter = this.parts[this.pos];
		if(varName.test(liter)){
			this.pos++;
			if(this.parts[this.pos]=="("){
				// method execution
			}else{ // is variable
				// @TODO get variable
				return -1;
			}
		}else if(liter=="("){
			this.pos++;
			result = this.level1();
			
			if(this.parts[this.pos] != ")") 
				throw "Missing ')' in position " +  this.pos + ".";
			else{
				console.log("Find Close Bracket: %s `%s`, res: `%s`", this.pos, this.parts[this.pos],result);
				//this.pos++;
				
			}
			//this.pos++;
		}else{
			result = this.symbol();
		}
		
		return result;
	}
};
var ee = new ExpresionEngine();
var expr1 = 'if(x<y,{a|a+1})(12)';
var expr2 = '(1+2+3*(abs)(-1)+13)';
expr2 = '1+2+3*(2+3)*-1';
expr2 = '1+2+2*3/5+3*4-1';
expr2 = '1+2-(3+1-33)+-1+11+56';
ee.parser(expr2);
ee.pos = 0;
console.log(expr2);
ee.subExpresionParser(0);
//var total = ee.level1();
//console.log("RES: %s",total);

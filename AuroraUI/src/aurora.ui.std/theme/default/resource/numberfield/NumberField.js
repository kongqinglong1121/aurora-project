$A.NumberField = Ext.extend($A.TextField,{
	allowdecimals : true,
	baseChars : "0123456789",
    decimalSeparator : ".",
    decimalprecision : 2,
    allownegative : true,
	constructor: function(config) {
        $A.NumberField.superclass.constructor.call(this, config);
    },
    initComponent : function(config){
    	$A.NumberField.superclass.initComponent.call(this, config); 
    	this.allowed = this.baseChars+'';
        if(this.allowdecimals){
            this.allowed += this.decimalSeparator;
        }
        if(this.allownegative){
            this.allowed += "-";
        }
    },
    initEvents : function(){
    	$A.NumberField.superclass.initEvents.call(this);    	
    },
    onKeyPress : function(e){
        var k = e.getKey();
        //!Ext.isIE && (e.isSpecialKey() ||
        if(e.isSpecialKey()){
            return;
        }
        var c = e.getCharCode();
        if(this.allowed.indexOf(String.fromCharCode(c)) === -1){
            e.stopEvent();
            return;
        }
        $A.NumberField.superclass.onKeyPress.call(this, e); 
    },
    onBlur : function(e){
    	this.setRawValue(this.fixPrecision(this.parseValue(this.getRawValue())));
    	$A.NumberField.superclass.onBlur.call(this,e);    	
    },
    parseValue : function(value){
    	if(!this.allownegative)value = String(value).replace('-','');
    	if(!this.allowdecimals)value = value.substring(0,value.indexOf("."))
        value = parseFloat(String(value).replace(this.decimalSeparator, "."));
        return isNaN(value) ? '' : value;
    },
    fixPrecision : function(value){
        var nan = isNaN(value);
        if(!this.allowdecimals || this.decimalprecision == -1 || nan || !value){
           return nan ? '' : value;
        }
        return parseFloat(parseFloat(value).toFixed(this.decimalprecision));
    }
})
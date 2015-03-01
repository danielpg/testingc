jQuery.unserialize = function(str){
		var items = str.split('&');
		var ret = "{";
		var arrays = [];
		var index = "";
		for (var i = 0; i < items.length; i++) {
			var parts = items[i].split(/=/);
			//console.log(parts[0], parts[0].indexOf("%5B"),  parts[0].indexOf("["));
			if (parts[0].indexOf("%5B") > -1 || parts[0].indexOf("[") > -1){
				//Array serializado
				index = (parts[0].indexOf("%5B") > -1) ? parts[0].replace("%5B","").replace("%5D","") : parts[0].replace("[","").replace("]","");
				//console.log("array detectado:", index);
				//console.log(arrays[index] === undefined);
				if (arrays[index] === undefined){
					arrays[index] = [];
				}
				arrays[index].push( decodeURIComponent(parts[1].replace(/\+/g," ")));
				//console.log("arrays:", arrays);
			} else {
				//console.log("common item (not array)");
				if (parts.length > 1){
					ret += "\""+parts[0] + "\": \"" + decodeURIComponent(parts[1].replace(/\+/g," ")).replace(/\n/g,"\\n").replace(/\r/g,"\\r") + "\", ";
				}
			}
			
		};
		
		ret = (ret != "{") ? ret.substr(0,ret.length-2) + "}" : ret + "}";
		//console.log(ret, arrays);
		var ret2 = JSON.parse(ret);
		//proceso los arrays
		for (arr in arrays){
			ret2[arr] = arrays[arr];
		}
		return ret2;
}

jQuery.fn.unserialize = function(parm){
		//If not string, JSON is assumed.
		var items = (typeof parm == "string") ? parm.split('&') : parm;
		if (typeof items !== "object"){
			throw new Error("unserialize: string or JSON object expected.");
		}
		//Check for the need of building an array from some item.
		//May return a false positive, but it's still better than looping twice.
		//TODO: confirm if it's ok to simplify this method by always calling
		//$.unserialize(parm) without any extra checking. 
		var need_to_build = ((typeof parm == "string") && decodeURIComponent(parm).indexOf("[]=") > -1);
		items = (need_to_build) ? $.unserialize(parm) : items;
		
		for (var i in items){
			//if(items[i] == "")continue;
			//console.log(items[i]);
			var parts = (items instanceof Array) ? items[i].split(/=/) : [i, (items[i] instanceof Array) ? items[i] : "" + items[i]];
			parts[0] = decodeURIComponent(parts[0]);
			if (parts[0].indexOf("[]") == -1 && parts[1] instanceof Array){
				parts[0] += "[]";
			}
			obj = this.find('[name=\''+ parts[0] +'\']');
			if (obj.length == 0){
				try{
					obj = this.parent().find('[name=\''+ parts[0] +'\']');
				} catch(e){}
			}
			if (typeof obj.attr("type") == "string" && ( obj.attr("type").toLowerCase() == "radio" || obj.attr("type").toLowerCase() == "checkbox")){
				 obj.each(function(index, coso) {
					coso = $(coso);
					//if the value is an array, i gotta search the item with that value.
					if (parts[1] instanceof Array){
						for (var i2 in parts[1]){
							var val = ""+parts[1][i2];
							if (coso.attr("value") == decodeURIComponent(val.replace(/\+/g," "))){
								coso.prop("checked",true);
								if(form_refresh)coso.checkboxradio( "refresh" );
							} else {
								if (!$.inArray(coso.val(),parts[1])){
									coso.prop("checked",false);
									if(form_refresh)coso.checkboxradio( "refresh" );
								}
							}
						}
					} else {
						val = "" + parts[1];
						if (coso.attr("value") == decodeURIComponent(val.replace(/\+/g," "))){
							coso.prop("checked",true);
						} else {
							coso.prop("checked",false);
						}
						if(form_refresh)coso.checkboxradio( "refresh" );
					}
				 });
			} else if (obj.length > 0 && obj[0].tagName == "SELECT" && parts[1] instanceof Array && obj.prop("multiple")){
				//Here, i have an array for a multi-select.
				obj.val(parts[1]);
				if(form_refresh)obj.selectmenu( "refresh" );			
			} else {
				//When the value is an array, we join without delimiter
				var val = (parts[1] instanceof Array) ? parts[1].join("") : parts[1];
				//when the value is an object, we set the value to ""
				val = ((typeof val == "object") || (typeof val == "undefined")) ? "" : val;
				
				obj.val(decodeURIComponent(val.replace(/\+/g," ")));
				force_select_option( obj.attr("id") , val );	

				if(parts[1] == "overnight"){
					if(form_refresh)obj.selectmenu( "refresh" );			
				}
				//alert(parts[1]);

			}

		};
		return this;
}

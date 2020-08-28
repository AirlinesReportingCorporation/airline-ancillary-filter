var jsonData = { "airlines": [] };
var jsonHeaders = {};
var ancillaryFilters = [];
var gdsFilters = [];
var airlineFilters = [];

var headerRows = ["A"];


/* START ========================================================*/
//defiantFunction - filter JSON

function defiantContains(myData, field, searchTerm){

	var s = '//*[' + field + '[contains(' + searchTerm + ', "' + searchTerm + '")]]';

	//if ancillaries all - and filter with GDS
	if (field == "all" && searchTerm == "all"){
		s = '//airlines';
	}
	else if (field == "all") {
		s = '//*[' + searchTerm + '="' + searchTerm +'"]/..';
	}
	//if GDS all - and filter with ancillaries
	else if(searchTerm == "all") {
		s = '//*[' + field + ']';
	}
	else if(field == "name") {
		s = '//*[contains(name, "' + searchTerm.replace(".", "") +'")]';
	}
	
	console.log(s);
	
	return JSON.search(myData, s);
}	
/* END ========================================================*/

/* START ========================================================*/
//equalityFunc
function equalNames(union1, union2){
	
	return union1.name === union2.name;

}

/* END ========================================================*/

/* START ========================================================*/
	//intersect
function intersect(a, b) {
		var t;
		
		if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
		
		return a.filter(function(e) {
			return b.some(function(f) {
				return f.name === e.name;
			});
		});
		
}

/* END ========================================================*/

/* START ========================================================*/
//arrayUntion
function arrayUnion(arr1, arr2, equalityFunc) {
		var union = arr1.concat(arr2);

		for (var i = 0; i < union.length; i++) {
				for (var j = i+1; j < union.length; j++) {
						if (equalityFunc(union[i], union[j])) {
								union.splice(j, 1);
								j--;
						}
				}
		}

		return union;
}
/* END ========================================================*/


/* START ========================================================*/
//Axios ajax call to get xlsx file and parse data into a consumable JSON variable
//Then calls applyFilter() function to apply default layout
axios({
	method:'get',
	url: "https://www2.arccorp.com/globalassets/test/matrix.xlsx",
	responseType:'arraybuffer'
})
	.then(function(response) {
		
		//Var initializiation 
		/*
			for xlsx response vars
		*/
		var data = new Uint8Array(response.data);
		var workbook = XLSX.read(data, {type:"array"});
					
		var workbookData = workbook["Sheets"]["Sheet1"];

		
		//traverseEntireWorkBook
		for(var key in workbookData) {
		
			//value in cell
			var val = workbookData[key].w;
		
			//traverse through each cell in sheet
			if(key.indexOf("!") < 0){
				var str = key.match(/[a-z]+|[^a-z]+/gi);

							
				//setHeaderNames first
				/*
					gets the key and letter matching for getting headers from the excel row column 
				*/
				
				//if on first row, then it is a header, add to header array
				//also add filter button markup to filters row
				if(str[1] === "1") {
					jsonHeaders[key[0]] = val.replace(/ /g,"_");
					//add filters 
					$(".filters-row").append('<button id="filters-' + val.replace(/ /g,"_") + '" type="button" class="filters-badge btn btn-secondary btn-sm">' + val + ' <span class="badge"> <i class="fa fa-times"></i></span></button>');
				}
				//if first column, then create new obj to insert into Json Data starting with first obj
				else if(str[0] === "A" && str[1] !== "1") {
				
					//add new object
					jsonData["airlines"].push( {
						"name" : val
					});
					
					//add filter buttons
					$(".filters-row").append('<button id="filters-' + val.replace(/ /g,"_").replace(".", "") + '" type="button" class="filters-badge btn btn-secondary btn-sm">' + val + ' <span class="badge"> <i class="fa fa-times"></i></span></button>');
					
					$(".airlines-checkboxes").append('<input id="name' + val.replace(/ /g,"_").replace(".", "") + '" name="nameCheck" type="checkbox" value="' + val.replace(/ /g,"_") + '"> ' + val + "<br/>");
					
					$(".airline-select").append('<option id="name' + val.replace(/ /g,"_").replace(".", "") + '" name="nameCheck" type="checkbox" value="' + val.replace(/ /g,"_") + '"> ' + val + "<br/>");
					
				}
				//else insert into latest object inserted in array that was created above
				else {
					
					//insert into last object inserted with corresponding tag
					var tag = jsonHeaders[str[0]];
					var tagVal = val.replace(/ *\([^)]*\) */g, "");
					
					//if property already exists, push push to that array (aka) amadeus and apollo in baggage
					if( jsonData["airlines"][ jsonData["airlines"].length - 1 ][tag] != undefined ) {

						jsonData["airlines"][ jsonData["airlines"].length - 1 ][tag][0][tagVal] = val;
					}

					//else set property with val in array
					else {
						jsonData["airlines"][ jsonData["airlines"].length - 1 ][tag] = [{}];
						jsonData["airlines"][ jsonData["airlines"].length - 1 ][tag][0][tagVal] = val;
					}
					
				}
				
			}
			
		}			
	
	//add filter badge listener for removing the filter
	$(".filters-badge").click(function(){
		var val = $(this).prop("id").replace("filters-", "");
		var aindex = ancillaryFilters.indexOf(val.replace(" ", "_"));
		var gindex = gdsFilters.indexOf(val.replace(" ", "_"));
		var nindex = airlineFilters.indexOf(val.replace(/_/g, " "));
		
		if(gindex > -1){
			gdsFilters.splice(gindex, 1);
		}
		else if(aindex > -1){
			ancillaryFilters.splice(aindex, 1);
		}
		else if (nindex > -1) {
			airlineFilters.splice(nindex , 1);

			//undisabled select
			//$(".airline-select").prop("disabled", false);

			//set back to default
			$(".airline-select").val("");
		}
		
		$("input[type='checkbox'][value='" + val + "']").prop("checked", false);
		$(this).hide();
		applyFilter();
		
	});
	
	$('.airline-select').change(function() {
	
		var val = $(this).val();
		var valU = $(this).val().replace(/ /g, "_").replace(".", "");;
		var index = airlineFilters.indexOf(val.replace(/_/g, " "));
		
		//if val is default, empty array
		if(val == ""){
			airlineFilters = [];
		}
		//else insert it into array 
		else {
			airlineFilters.push(val.replace(/_/g, " ").replace(".", ""));
			$("#filters-" + valU).show();
			//$(this).prop("disabled", true);
		}
		
	//applyFilter to results
		applyFilter();
	});
	
	applyFilter();
		
	})
	.catch(function (error) {
		console.log(error);
	});
	/* END ========================================================*/

	
	/* START ========================================================*/
	//listener for applying grid layout on the buttons
	$(".grid-icon").click(function(){
		var col = $(this).data("col");
		//console.log(col);
		
		$(".results .bs-col").removeClass("col-md-6").removeClass("col-md-12").removeClass("col-md-4");
		$(".grid-icon").removeClass("active");
		
		$(".results .bs-col").addClass(col);
		$(this).addClass("active");
	});
	
	/* END ========================================================*/
	
	/* START ========================================================*/
			
	function applyFilter() {

		$(".results").html("");
		$(".results").removeClass("expandAll");
		
		$(".grid-icons").show();
		
		var arr = [];
		
		//if both are empty, show all
		if(ancillaryFilters.length < 1 && gdsFilters.length < 1 && airlineFilters.length < 1) {
			arr = defiantContains(jsonData, "all", "all");
		}
		//just ancillary filters
		else if (ancillaryFilters.length >= 1 && gdsFilters.length == 0 && airlineFilters.length == 0) {

			var arrTemp = defiantContains(jsonData, ancillaryFilters[0], "all");
			
			//if multiple filters
			if(ancillaryFilters.length > 1){
				for(var i = 1; i < ancillaryFilters.length; i++) {
									
					arrTemp = intersect( arrTemp, defiantContains(jsonData, ancillaryFilters[i], "all") );
					
				}
			}
			
			arr = arrTemp;
			//console.log(arr);
		}
		//gds filters 
		else if(ancillaryFilters.length == 0 && gdsFilters.length >= 1 && airlineFilters.length == 0) {
		
			var arrTemp = defiantContains(jsonData, "all", gdsFilters[0]);
			
			//if multiple filters
			if(gdsFilters.length > 1){
				for(var i = 1; i < gdsFilters.length; i++) {
									
					arrTemp = intersect( arrTemp, defiantContains(jsonData, "all", gdsFilters[i]) );
					
				}
			}
			
			arr = arrTemp;
			
		}
		//just airlines
		else if(ancillaryFilters.length == 0 && gdsFilters.length == 0 && airlineFilters.length >= 1){
		
			var arrTemp = defiantContains(jsonData, "name", airlineFilters[0]);
			
			//if multiple filters
			if(airlineFilters.length > 1){
				for(var i = 1; i < airlineFilters.length; i++) {
									
					arrTemp = arrayUnion( arrTemp, defiantContains(jsonData, "name", airlineFilters[i]), equalNames );
					
				}
			}
			
			$(".results").addClass("expandAll");
			
			
			
			arr = arrTemp;
		
		}
		//else both gds and ancillaries
		else if(ancillaryFilters.length >= 1 && gdsFilters.length >= 1 && airlineFilters.length == 0){
		
			var arrTemp = defiantContains(jsonData, ancillaryFilters[0], gdsFilters[0]);
		
			if(ancillaryFilters.length > 1){
				for(var i = 1; i < ancillaryFilters.length; i++) {
									
					arrTemp = intersect( arrTemp, defiantContains(jsonData, ancillaryFilters[i], "all") );
					
				}
			}
			
			if(gdsFilters.length > 1){
				for(var i = 1; i < gdsFilters.length; i++) {
									
					arrTemp = intersect( arrTemp, defiantContains(jsonData, "all", gdsFilters[i]) );
					
				}
			}
			
			arr = arrTemp;
		
		}
		//if ancillaries and gds
		else if(ancillaryFilters.length >= 1 && gdsFilters.length >= 1 && airlineFilters.length == 0){
		
			var arrTemp = defiantContains(jsonData, "all", gdsFilters[0]);
			
			//if multiple filters
			if(gdsFilters.length > 1){
				for(var i = 1; i < gdsFilters.length; i++) {
									
					arrTemp = intersect( arrTemp, defiantContains(jsonData, "all", gdsFilters[i]) );
					
				}
			}
			
			if(airlineFilters.length > 0){
			
				var airlineIntersect = [];
				var airlineTemp = [];
			
				for(var i = 0; i < airlineFilters.length; i++) {
									
					airlineTemp = intersect( arrTemp, defiantContains(jsonData, "name", airlineFilters[i]), equalNames );
					airlineIntersect = arrayUnion(airlineIntersect, airlineTemp, equalNames);
				}
				
				arrTemp = airlineIntersect;
			}
			
			console.log(arrTemp);
			arr = arrTemp;
			
		}
		//if ancillaries and airlines
		else if(ancillaryFilters.length >= 1 && gdsFilters.length == 0 && airlineFilters.length >= 1){
		
			var arrTemp = defiantContains(jsonData, ancillaryFilters[0], "all");
			
			//if multiple filters
			if(ancillaryFilters.length > 1){
				for(var i = 1; i < ancillaryFilters.length; i++) {
									
					arrTemp = intersect( arrTemp, defiantContains(jsonData, ancillaryFilters[i], "all") );
					
				}
			}
			
			if(airlineFilters.length > 0){
			
				var airlineIntersect = [];
				var airlineTemp = [];
			
				for(var i = 0; i < airlineFilters.length; i++) {
									
					airlineTemp = intersect( arrTemp, defiantContains(jsonData, "name", airlineFilters[i]), equalNames );
					airlineIntersect = arrayUnion(airlineIntersect, airlineTemp, equalNames);
				}
				
				arrTemp = airlineIntersect;
			}
			
			console.log(arrTemp);
			arr = arrTemp;
			
		}
		// all 3
		else {
			var arrTemp = defiantContains(jsonData, ancillaryFilters[0], gdsFilters[0]);
		
			if(ancillaryFilters.length > 1){
				for(var i = 1; i < ancillaryFilters.length; i++) {
									
					arrTemp = intersect( arrTemp, defiantContains(jsonData, ancillaryFilters[i], "all") );
					
				}
			}
			
			if(gdsFilters.length > 1){
		
				for(var i = 1; i < gdsFilters.length; i++) {
									
					arrTemp = intersect( arrTemp, defiantContains(jsonData, "all", gdsFilters[i]) );
					
				}
			}
			
			if(airlineFilters.length > 0){
			
				var airlineIntersect = [];
				var airlineTemp = [];
			
				for(var i = 0; i < airlineFilters.length; i++) {
									
					airlineTemp = intersect( arrTemp, defiantContains(jsonData, "name", airlineFilters[i]), equalNames );
					airlineIntersect = arrayUnion(airlineIntersect, airlineTemp, equalNames);
				}
				
				arrTemp = airlineIntersect;
			}
			
			arr = arrTemp;
							
		}
		
		if( ancillaryFilters.length > 0 ) {
			$(".ancillary-select .filter-number").html("(" + ancillaryFilters.length + ")");
		}
		else {
			$(".ancillary-select .filter-number").html("");
		}
		
		if( gdsFilters.length > 0 ){
			$(".gds-select .filter-number").html("(" + gdsFilters.length + ")");
		}
		else {
			$(".gds-select .filter-number").html("");
		}
		
		if( airlineFilters.length > 0 ){
			$(".airline-select .filter-number").html("(" + airlineFilters.length + ")");
		}
		else {
			$(".airline-select .filter-number").html("");
		}
		
		$(".resultsTitle").html(arr.length);
		
		if(arr.length == 0){
			$(".results").html("<div class='airline-list'>No Results Found</div>");
		}
		
		//console.log(arr);
		
		//render results
		for(var i = 0; i < arr.length; i++) {
			
			$(".results").append("<div class='bs-col col-md-6 animated fadeIn'><div class='airline-list'><h3 class='airline-name'>" + arr[i].name +"</h3><div class='airline-extra'></div><div class='airline-view'> <span class='airline-text'>Show All</span> <i class='fa fa-angle-down'></i></div></div></div>");
			
			for(var key in arr[i]) {
				
				if(key != "name"){
					
					$(".results .airline-list .airline-extra").last().append("<div class='airline-column'><strong>" + key.replace("_", " ") + "</strong><br/></div>");
					
					for(var gds in arr[i][key][0]) {

						if(arr[i][key][0][gds].indexOf("http") > -1){
							$(".results .airline-list .airline-extra .airline-column").last().append("<a target='_blank' href='" + arr[i][key][0][gds] + "'>" + arr[i][key][0][gds] + "</a><br/>");
						}
						else if(arr[i][key][0][gds].indexOf("www") > -1){
							$(".results .airline-list .airline-extra .airline-column").last().append("<a target='_blank' href='http://" + arr[i][key][0][gds] + "'>" + arr[i][key][0][gds] + "</a><br/>");
						}
						else {
							$(".results .airline-list .airline-extra .airline-column").last().append(arr[i][key][0][gds] + "<br/>");
						}
					}
				}
				
			}
			
			
		}
		
		if($(".results").hasClass("expandAll")){
			$(".airline-text").html("Hide");
			$(".airline-view").find("i").removeClass("fa-angle-down").addClass("fa-angle-up");
		}
		
		$(".airline-view").click(function(){
			
			var text = $(this).find(".airline-text");
			
			if( text.text() == "Show All" ) {
				text.html("Hide");
				$(this).find("i").removeClass("fa-angle-down").addClass("fa-angle-up");
			}
			else {
				text.html("Show All");
				$(this).find("i").removeClass("fa-angle-up").addClass("fa-angle-down");
			}
			
			$(this).parent().find(".airline-extra").slideToggle();
		});
		

		
	}
	/* END ========================================================*/

	
	//check ancillary function
	$('[name="ancillaryCheck"]').change(function() {
	
		var val = $(this).val();
		var valU = $(this).val().replace(" ", "_");
		var index = ancillaryFilters.indexOf(val);
		
		//if in array, remove
		if( index > -1 ) {
			ancillaryFilters.splice(index, 1);
			$("#filters-" + valU).hide();
		}
		//else insert it into array 
		else {
			ancillaryFilters.push(val);
			$("#filters-" + valU).show();
		}
		
		//applyFilter to results
		applyFilter();
	});
	/* END ========================================================*/
	
	//check gds function
	$('[name="gdsCheck"]').change(function() {
	
		var val = $(this).val();
		var valU = $(this).val().replace(" ", "_");
		var index = gdsFilters.indexOf(val);
		
		//if in array, remove
		if( index > -1 ) {
			gdsFilters.splice(index, 1);
			$("#filters-" + valU).hide();
		}
		//else insert it into array 
		else {
			gdsFilters.push(val);
			$("#filters-" + valU).show();
		}
		
		//applyFilter to results
		applyFilter();
	});
	
	$(".filter-select").click(function(){
	
		if($(this).hasClass("icon-x")){
	
			if($(this).hasClass("ancillary-select")){
				$(".ancillary-checkboxes").hide();
			}
			else if($(this).hasClass("gds-select")){
				$(".gds-checkboxes").hide();
			}
			
			$(".filter-select").removeClass("icon-x");
		}
		else if($(this).hasClass("ancillary-select")){
			$(".filter-select").removeClass("icon-x");
			$(".ancillary-checkboxes").show();
			$(".gds-checkboxes").hide();
			$(".airlines-checkboxes").hide();
			$(this).addClass("icon-x");
		}
		else if($(this).hasClass("gds-select")){
			$(".filter-select").removeClass("icon-x");
			$(".ancillary-checkboxes").hide();
			$(".gds-checkboxes").show();
			$(".airlines-checkboxes").hide();
			$(this).addClass("icon-x");
		}

				
		
	});
	
	
	$(".airline-select").parent().click(function(){
			$(".ancillary-checkboxes").hide();

			$(".gds-checkboxes").hide();
			
			$(".filter-select").removeClass("icon-x");
	});
	/* END ========================================================*/
	
	//clear filter button
	$(".filter-clear button").click(function(){
		ancillaryFilters = [];
		gdsFilters = [];
		airlineFilters = [];
		
		$("input[type=checkbox]:checked").prop("checked", false);
		//undisabled select
		//$(".airline-select").prop("disabled", false);

		//set back to default
		$(".airline-select").val("");
		
		$(".filters-badge").hide();
		
		applyFilter();
	});

	
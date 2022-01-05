function cmp(a,b){
	return a-b;
}

function readTxtFile(file, callback){
	var reader = new FileReader();
	reader.onload = function(){
		callback(reader.result);
	};
 	reader.readAsText(file);
}

function parseRaw(raw, callback){
	console.log("parse raw");
	var rows = raw.split("\n");
	
	//remove commented section of 23andme raw data file
	while(rows[0][0]=="#"){
		rows.splice(0,1);
	}
			
	//remove non-Y rows from the top
	while(rows[0].split("\t")[1] != "Y"){
		rows.splice(0,1);
	}
	
	//remove non-Y rows from the bottom
	while(rows[rows.length-1].split("\t")[1] != "Y"){
		rows.splice(rows.length-1,1);
	}
			
	//pack the data into array
	var data=[];
	for(var i=0;i<rows.length;++i){
		data.push(rows[i].split("\t"));
		
		//delete "\r" from the code
		data[i][2] = Number(data[i][2]);
		data[i][3]=data[i][3].split("\r")[0];
	}

	//delete duplicates with same position
	data.sort(function(a,b){
		return a[2]>b[2];
	});
	
	for(var i=0;i<data.length-1;++i){
		while(data[i][2]==data[i+1][2]){
			data[i][0]+="/"+data[i+1][0];
			data.splice(i+1,1);
		}
	}

	if(data[data.length-1][0]=="") data.pop(); //trim the array
	callback(data);
}

function parseDB(db, callback){
	console.log("parse db");
	var rows = db.split("\n");
	
	//remove the label row
	rows.splice(0,1);
	var data=[];
	
	for(var i=0;i<rows.length;++i){
		data.push(rows[i].split(","));
		data[i][1] = Number(data[i][1]);
	}
	
	data.sort(function(a,b){
		return a[1]>b[1];
	});

	//merge duplicate positions
	for(var i=0;i<data.length-1;++i){
		while(data[i][1]==data[i+1][1]){
			data[i][0]+="/"+data[i+1][0];
			data.splice(i+1,1);
		}
	}

	if(data[data.length-1][0]=="") data.pop(); //trim the array
	callback(data);
}

function makeList(array, sign) {
	var list = array[0]+sign;
 	for(var i = 1; i < array.length; ++i) {
   		list += ", " + array[i]+sign;
	}
	return list;
}

function filesReady(t1, t2){
	console.log("files ready");
	parseRaw(t1,function(raw){
		parseDB(t2,function(db){
			console.log("compare arrays");
			
			//compare two arrays
			//db[][1] vs raw[][2] for position
			//db[][2] vs raw[][3] for snp
			var positive=[];
			var negative=[];
			var nocall=[];
			//var error=[];
			
			var last=0;
			for(var i=0;i<db.length;++i){
				for(var j=last;j<raw.length;++j){
					if(db[i][1]>raw[j][2]){
						last=j+1;
						break;
					}else if(db[i][1]==raw[j][2]){
						last=j+1;							
						switch(raw[j][3]){
							case "--":
								nocall.push(db[i][0]);
							break;
								
							case db[i][2].split("->")[1]:
								positive.push(db[i][0]);
							break;
								
							case db[i][2].split("->")[0]:
								negative.push(db[i][0]);
							break;
								
							default:
								//error.push(db[i][0]);
							break;
						}
						break;
					}
				}
			}
			
			//sort the arrays
			
			positive.sort(cmp);
			negative.sort(cmp);
			nocall.sort(cmp);
			//error.sort(cmp);
			console.log("display results");
			console.log("Positive: " + positive.length + ", Negative: " + negative.length + ", No call: " + nocall.length);
			
			//display results
			document.getElementById('results').textContent="Results (positive first):";	
			document.getElementById('res').textContent=makeList(positive, "+")+", "+ makeList(negative, "-");
			document.getElementById('nocall').textContent="No call:";					
			document.getElementById('ncs').textContent=makeList(nocall, "");
			//document.getElementById('err').textContent=makeList(error);
		});
	});
}

function start(){
	var fraw = document.getElementById("raw").files[0];
	var fdb = document.getElementById("db").files[0];
	//read files
	if(fraw && fdb){
		readTxtFile(fraw, function(text1){
			readTxtFile(fdb, function(text2){
				filesReady(text1, text2);
			});
		});
	}else alert("One or more files is missing!");
}

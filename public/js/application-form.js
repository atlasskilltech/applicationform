
//Localhost
// var applicationURL = "http://localhost/admission/index.php/applications/doAdmission";
// var StateCityURL = "http://localhost/admission/index.php/applications/getStateCity";
// var uploadURL = "http://localhost/admission/index.php/applications/uploadFile";
// var successApplnURL = "http://localhost/admission/index.php/payments";

//Localhost isme
// var applicationURL = "http://localhost/admission/index.php/isme/applications/doAdmission";
// var StateCityURL = "http://localhost/admission/index.php/isme/applications/getStateCity";
// var uploadURL = "http://localhost/admission/index.php/isme/applications/uploadFile";
// var successApplnURL = "http://localhost/admission/payments";



//Live isdi
// var applicationURL = "http://admissionisdi.in/admission/index.php/applications/doAdmission";
// var StateCityURL = "http://isdi.in/admission/index.php/applications/getStateCity";
// var uploadURL = "http://isdi.in/admission/index.php/applications/uploadFile";
// var successApplnURL = "http://isdi.in/admission/index.php/payments";

//Live admissions.isme.co.in
var applicationURL = "/isme/applications/doAdmission";
var applicationURLTesting = "/isme/applications/doAdmissionTesting";
var formSubmit = "/isme/applications/formSubmit";
var StateCityURL = "/isme/applications/getStateCity";
var uploadURL = "/isme/applications/uploadFile";
var uploadURL1 = "/isme/applications/uploadFile1";
var uploadURL2 = "/isme/applications/uploadFile2";
var uploadURL3 = "/isme/applications/uploadFile3";
var uploadURL4 = "/isme/applications/uploadFile4";
var successApplnURL = "/Payments";

var uploadURLCerticate = "/isme/applications/uploadURLCerticate";

var applicationURL4 = "/isme/applications/doAdmissionAcm";
var successApplnURL4 = "/Payments";

var AcedemicURL = "/isme/applications/getAcedemic";
var AcedemicURL1 = "/isme/applications/getAcedemic2";
var AbbrivationURL = "/isme/applications/getAbbrivation";
var certificateURL = "/isme/applications/getCerticiate";
var schoolURL = "/isme/applications/getSchoolList";

var AbbrivationURL1 = "/isme/applications/getAbbrivation1";
var SpecialisationURL = "/isme/applications/getSpecialisation";

var doAdmission31 = "/isme/applications/doAdmission3";
var successApplnURL31 = "https://www.atlasskilltech.com/admissions/verify";
var StateCitySchoolURL = "/applications/getStateCitySchool";

var callURL = "/";

function doAdmission()
{
    
    
    console.log(applicationURL);
	$('.error_msg').remove();
	
	var myObj={};
		
	var formData=$("form").serializeArray();	

	$.each(formData,function(i,form){
		myObj[form.name]=form.value;
	});
		
	myObj['captcha']=grecaptcha.getResponse();
	
	$.ajax
	({
		type:"POST",
		url:applicationURL,
		dataType:"json",
		data:myObj,
		success:function(res)
		{
			if(res.status==0)
			{
				//First Element From Array.
				//alert(Object.keys(res.error)[1]);
				console.log(res.error);
				//Focus First error.
				var a=$("#"+Object.keys(res.error)[0]).offset().top-135;
				
				$("html,body").animate({"scrollTop":a},500);
				
				$.each(res.error,function(i,field){
					//alert(i);//Key
					//alert(field);//Value
					$("#"+i).after("<div class='error_msg'><span><i class='fa fa-exclamation-circle' aria-hidden='true'></i>&nbsp; "+field+"</span></div>");
					
				});
				fadeErrorMsg();
			}
			else if(res.status==1)
			{
			    gtag_report_conversion(callURL);
				//alert("Success");	
				window.location=successApplnURL;
				
			}
		}
	});
}
function doAdmission2(elem)
{
	$('.error_msg').remove();
	
	var myObj={};
		
	//var formData=$("form").serializeArray();
	var idClicked = $(elem).attr("id");

	console.log(idClicked);

	if (idClicked=="ug-submit") {		
	var formData=$('form[name="ug-"]').serializeArray();
	}else if(idClicked=="pg-submit") {		
	var formData=$('form[name="pg-"]').serializeArray();
	}else if(idClicked=="pgdse-submit") {		
	var formData=$('form[name="pgdse-"]').serializeArray();
	}
    formData=$('form[name="ug-"]').serializeArray();
	console.log(formData);

	console.log(applicationURL);
	
	 let selectedOptions = [];

        // Get all checked checkboxes
        document.querySelectorAll('input[name="special_assistance_type[]"]:checked').forEach((checkbox) => {
            selectedOptions.push(checkbox.value);
        });

        // Check if "Other condition" is selected and get its text
        const otherConditionCheckbox = document.getElementById("other_condition_checkbox");
        const otherConditionText = document.getElementById("special_assistance_other_condition").value.trim();

        if (otherConditionCheckbox.checked && otherConditionText) {
            selectedOptions.push(`Other: ${otherConditionText}`);
        }

	$.each(formData,function(i,form){
		myObj[form.name]=form.value;
	});
	
	let selectedOptionsString = selectedOptions.join(", ");
	
	myObj['special_assistance_type']=selectedOptionsString;
	
		if (formData.form_part == 1) {
	myObj['captcha']=grecaptcha.getResponse();
	}
	$.ajax
	({
		type:"POST",
		url:applicationURL,
		dataType:"json",
		data:myObj,
		 beforeSend: function() {
                $("#ug-submit").html('<i class="fa fa-spin fa-spinner"></i> Please Wait..');
                $("#ug-submit").attr("disabled", true);
            },
		success:function(res)
		{
			console.log(res);
			if(res.status==0)
			{
			      $("#ug-submit").html('Submit');
                  $("#ug-submit").attr("disabled", false);
				//First Element From Array.
				//alert(Object.keys(res.error)[1]);
				console.log(res.error);
				//Focus First error.
				if (Object.keys(res.error)[0] != 'accept'){

					var a=$("#"+Object.keys(res.error)[0]).offset().top-135;
				
					$("html,body").animate({"scrollTop":a},500);
				}
				
				
				$.each(res.error,function(i,field){
					//alert(i);//Key
					//alert(field);//Value
					if (i=='accept') {	
						alert(field);
					}else if(i=='special_accept'){
					    alert(field);
					}else if(i=='dob'){
					    $("#"+i).parent().after("<div class='error_msg'><span><i class='fa fa-exclamation-circle' aria-hidden='true'></i>&nbsp; "+field+"</span></div>");
					}else{

						$("#"+i).after("<div class='error_msg'><span><i class='fa fa-exclamation-circle' aria-hidden='true'></i>&nbsp; "+field+"</span></div>");
					}
					
					
				});
				fadeErrorMsg();
			}
			else if(res.status==1)
			{
				//alert("Success");	
				$("#ug-submit").html('Submit');
                 $("#ug-submit").attr("disabled", false);
                 if (window.atlasTrackSubmitted) window.atlasTrackSubmitted(res.applnID);
				window.location=successApplnURL;
				
			}
		}
	});
}
function doAdmissionTesting(elem)
{
	$('.error_msg').remove();
	
	var myObj={};
		
	//var formData=$("form").serializeArray();
	var idClicked = $(elem).attr("id");

	console.log(idClicked);

	if (idClicked=="ug-submit") {		
	var formData=$('form[name="ug-"]').serializeArray();
	}else if(idClicked=="pg-submit") {		
	var formData=$('form[name="pg-"]').serializeArray();
	}else if(idClicked=="pgdse-submit") {		
	var formData=$('form[name="pgdse-"]').serializeArray();
	}
    formData=$('form[name="ug-"]').serializeArray();
	console.log(formData);

	console.log(applicationURLTesting);
	
	 let selectedOptions = [];

        // Get all checked checkboxes
        document.querySelectorAll('input[name="special_assistance_type[]"]:checked').forEach((checkbox) => {
            selectedOptions.push(checkbox.value);
        });

        // Check if "Other condition" is selected and get its text
        const otherConditionCheckbox = document.getElementById("other_condition_checkbox");
        const otherConditionText = document.getElementById("special_assistance_other_condition").value.trim();

        if (otherConditionCheckbox.checked && otherConditionText) {
            selectedOptions.push(`Other: ${otherConditionText}`);
        }

	$.each(formData,function(i,form){
		myObj[form.name]=form.value;
	});
	
	let selectedOptionsString = selectedOptions.join(", ");
	
	myObj['special_assistance_type']=selectedOptionsString;
	
		if (formData.form_part == 1) {
	myObj['captcha']=grecaptcha.getResponse();
	}
	$.ajax
	({
		type:"POST",
		url:applicationURLTesting,
		dataType:"json",
		data:myObj,
		 beforeSend: function() {
                $("#ug-submit").html('<i class="fa fa-spin fa-spinner"></i> Please Wait..');
                $("#ug-submit").attr("disabled", true);
            },
		success:function(res)
		{
			console.log(res);
			if(res.status==0)
			{
			      $("#ug-submit").html('Submit');
                  $("#ug-submit").attr("disabled", false);
				//First Element From Array.
				//alert(Object.keys(res.error)[1]);
				console.log(res.error);
				//Focus First error.
				if (Object.keys(res.error)[0] != 'accept'){

					var a=$("#"+Object.keys(res.error)[0]).offset().top-135;
				
					$("html,body").animate({"scrollTop":a},500);
				}
				
				
				$.each(res.error,function(i,field){
					//alert(i);//Key
					//alert(field);//Value
					if (i=='accept') {	
						alert(field);
					}else if(i=='special_accept'){
					    alert(field);
					}else if(i=='dob'){
					    $("#"+i).parent().after("<div class='error_msg'><span><i class='fa fa-exclamation-circle' aria-hidden='true'></i>&nbsp; "+field+"</span></div>");
					}else{

						$("#"+i).after("<div class='error_msg'><span><i class='fa fa-exclamation-circle' aria-hidden='true'></i>&nbsp; "+field+"</span></div>");
					}
				});
				fadeErrorMsg();
			}
			else if(res.status==1)
			{
				//alert("Success");	
				$("#ug-submit").html('Submit');
                 $("#ug-submit").attr("disabled", false);
				window.location=successApplnURL;
				
			}
		}
	});
}

function doAdmission3(elem)
{
	$('.error_msg').remove();
	
	var myObj={};
		
	//var formData=$("form").serializeArray();
	var idClicked = $(elem).attr("id");

	console.log(idClicked);

	if (idClicked=="ug-submit") {		
	var formData=$('form[name="ug-"]').serializeArray();
	}else if(idClicked=="pg-submit") {		
	var formData=$('form[name="pg-"]').serializeArray();
	}else if(idClicked=="pgdse-submit") {		
	var formData=$('form[name="pgdse-"]').serializeArray();
	}
    formData=$('form[name="ug-"]').serializeArray();
	console.log(formData);

	console.log(doAdmission31);

	$.each(formData,function(i,form){
		myObj[form.name]=form.value;
	});
		if (formData.form_part == 1) {
	myObj['captcha']=grecaptcha.getResponse();
	}
	$.ajax
	({
		type:"POST",
		url:doAdmission31,
		dataType:"json",
		data:myObj,
		success:function(res)
		{
			console.log(res);
			if(res.status==0)
			{
				//First Element From Array.
				//alert(Object.keys(res.error)[1]);
				console.log(res.error);
				//Focus First error.
				if (Object.keys(res.error)[0] != 'accept'){

					var a=$("#"+Object.keys(res.error)[0]).offset().top-135;
				
					$("html,body").animate({"scrollTop":a},500);
				}
				
				
				$.each(res.error,function(i,field){
					//alert(i);//Key
					//alert(field);//Value
					if (i=='accept') {	
						alert(field);
					}else{

						$("#"+i).after("<div class='error_msg'><span><i class='fa fa-exclamation-circle' aria-hidden='true'></i>&nbsp; "+field+"</span></div>");
					}
					
					
				});
				fadeErrorMsg();
			}
			else if(res.status==1)
			{
				//alert("Success");	
				window.location=successApplnURL31;
				
			}
		}
	});
}

function doAdmission4(elem)
{
	$('.error_msg').remove();
	
	var myObj={};
		
	//var formData=$("form").serializeArray();
	var idClicked = $(elem).attr("id");

	console.log(idClicked);

	if (idClicked=="ug-submit") {		
	var formData=$('form[name="ug-"]').serializeArray();
	}else if(idClicked=="pg-submit") {		
	var formData=$('form[name="pg-"]').serializeArray();
	}else if(idClicked=="pgdse-submit") {		
	var formData=$('form[name="pgdse-"]').serializeArray();
	}
    formData=$('form[name="ug-"]').serializeArray();
	console.log(formData);

	console.log(applicationURL);

	$.each(formData,function(i,form){
		myObj[form.name]=form.value;
	});
		if (formData.form_part == 1) {
	myObj['captcha']=grecaptcha.getResponse();
	}
	$.ajax
	({
		type:"POST",
		url:applicationURL4,
		dataType:"json",
		data:myObj,
	    beforeSend: function() {
                $("#ug-submit").html('<i class="fa fa-spin fa-spinner"></i> Please Wait..');
                $("#ug-submit").attr("disabled", true);
            },
		success:function(res)
		{
			console.log(res);
			if(res.status==0)
			{
			     $("#ug-submit").html('Submit');
                 $("#ug-submit").attr("disabled", false);
				//First Element From Array.
				//alert(Object.keys(res.error)[1]);
				console.log(res.error);
				//Focus First error.
				if (Object.keys(res.error)[0] != 'accept'){

					var a=$("#"+Object.keys(res.error)[0]).offset().top-135;
				
					$("html,body").animate({"scrollTop":a},500);
				}
				
				
				$.each(res.error,function(i,field){
					//alert(i);//Key
					//alert(field);//Value
					if (i=='accept') {	
						alert(field);
					}else{

						$("#"+i).after("<div class='error_msg'><span><i class='fa fa-exclamation-circle' aria-hidden='true'></i>&nbsp; "+field+"</span></div>");
					}
					
					
				});
				fadeErrorMsg();
			}
			else if(res.status==1)
			{
			     $("#ug-submit").html('Submit');
                $("#ug-submit").attr("disabled", false);
				//alert("Success");	
				window.location=successApplnURL4;
				
			}
		}
	});
}


//----------------------------------------------------------------------------------------------------------------------------------------------
function fadeErrorMsg()
{
	$("input,select,textarea").click(function(){
		$(this).next('.error_msg').fadeOut(300);							 
		//alert(1);
	});						   
}
//----------------------------------------------------------------------------------------------------------------------------------------------
function uploadFile()
{
	$("#progress").css("opacity",0);
	
	var fileInput = $("input[name='userfile']");
	var files = fileInput.prop('files');
	var fd = new FormData();
	fd.append('file', files[0]);
	
	$.ajax
	({
		xhr: function()
		{
			var xhr = new window.XMLHttpRequest();
			//Upload progress
			xhr.upload.addEventListener("progress", function(evt){
				if (evt.lengthComputable)
				{
					var percentComplete = evt.loaded / evt.total;
					//Do something with upload progress
					$("#progress").css("opacity",1).attr("value",percentComplete);
				}
			}, false);
			//Download progress
			xhr.addEventListener("progress", function(evt){
				if (evt.lengthComputable)
				{
					var percentComplete = evt.loaded / evt.total;
					//Do something with download progress
					$("#progress").css("opacity",1).attr("value",percentComplete);
				}
			}, false);
			return xhr;
		},
		type:"POST",
		url:uploadURL,
		dataType:"json",
		data:fd,
		contentType:false,
		processData:false,
		cache: false,
		success:function(res)
		{
			if(res.status==0)
			{
				$("input[name='userfile']").after("<div class='error_msg'><span><i class='fa fa-exclamation-circle' aria-hidden='true'></i>&nbsp; "+res.error+"</span></div>");
			}
			else if(res.status==1)
			{
				$("#progress").css("opacity",0);
				$("#uploadSuccess").html('<i class="fa fa-check-circle" aria-hidden="true" style="color:#009900; font-size:16px"></i>');
			}
		}
	});	
}

function uploadFile1()
{
	$("#progress").css("opacity",0);
	
	var fileInput = $("input[name='tenmarksheet']");
	var files = fileInput.prop('files');
	var fd = new FormData();
	fd.append('file', files[0]);
	
	$.ajax
	({
		xhr: function()
		{
			var xhr = new window.XMLHttpRequest();
			//Upload progress
			xhr.upload.addEventListener("progress", function(evt){
				if (evt.lengthComputable)
				{
					var percentComplete = evt.loaded / evt.total;
					//Do something with upload progress
					$("#progress").css("opacity",1).attr("value",percentComplete);
				}
			}, false);
			//Download progress
			xhr.addEventListener("progress", function(evt){
				if (evt.lengthComputable)
				{
					var percentComplete = evt.loaded / evt.total;
					//Do something with download progress
					$("#progress").css("opacity",1).attr("value",percentComplete);
				}
			}, false);
			return xhr;
		},
		type:"POST",
		url:uploadURL1,
		dataType:"json",
		data:fd,
		contentType:false,
		processData:false,
		cache: false,
		success:function(res)
		{
			if(res.status==0)
			{
				$("input[name='tenmarksheet']").after("<div class='error_msg'><span><i class='fa fa-exclamation-circle' aria-hidden='true'></i>&nbsp; "+res.error+"</span></div>");
			}
			else if(res.status==1)
			{
				$("#progress").css("opacity",0);
				$("#uploadSuccess").html('<i class="fa fa-check-circle" aria-hidden="true" style="color:#009900; font-size:16px"></i>');
			}
		}
	});	
}

function uploadFile2()
{
	$("#progress").css("opacity",0);
	
	var fileInput = $("input[name='xiimarksheet']");
	var files = fileInput.prop('files');
	var fd = new FormData();
	fd.append('file', files[0]);
	
	$.ajax
	({
		xhr: function()
		{
			var xhr = new window.XMLHttpRequest();
			//Upload progress
			xhr.upload.addEventListener("progress", function(evt){
				if (evt.lengthComputable)
				{
					var percentComplete = evt.loaded / evt.total;
					//Do something with upload progress
					$("#progress").css("opacity",1).attr("value",percentComplete);
				}
			}, false);
			//Download progress
			xhr.addEventListener("progress", function(evt){
				if (evt.lengthComputable)
				{
					var percentComplete = evt.loaded / evt.total;
					//Do something with download progress
					$("#progress").css("opacity",1).attr("value",percentComplete);
				}
			}, false);
			return xhr;
		},
		type:"POST",
		url:uploadURL2,
		dataType:"json",
		data:fd,
		contentType:false,
		processData:false,
		cache: false,
		success:function(res)
		{
			if(res.status==0)
			{
				$("input[name='xiimarksheet']").after("<div class='error_msg'><span><i class='fa fa-exclamation-circle' aria-hidden='true'></i>&nbsp; "+res.error+"</span></div>");
			}
			else if(res.status==1)
			{
				$("#progress").css("opacity",0);
				$("#uploadSuccess").html('<i class="fa fa-check-circle" aria-hidden="true" style="color:#009900; font-size:16px"></i>');
			}
		}
	});	
}

function uploadFile3()
{
	$("#progress").css("opacity",0);
	
	var fileInput = $("input[name='special_assistance_doc']");
	var files = fileInput.prop('files');
	var fd = new FormData();
	fd.append('file', files[0]);
	
	$.ajax
	({
		xhr: function()
		{
			var xhr = new window.XMLHttpRequest();
			//Upload progress
			xhr.upload.addEventListener("progress", function(evt){
				if (evt.lengthComputable)
				{
					var percentComplete = evt.loaded / evt.total;
					//Do something with upload progress
					$("#progress").css("opacity",1).attr("value",percentComplete);
				}
			}, false);
			//Download progress
			xhr.addEventListener("progress", function(evt){
				if (evt.lengthComputable)
				{
					var percentComplete = evt.loaded / evt.total;
					//Do something with download progress
					$("#progress").css("opacity",1).attr("value",percentComplete);
				}
			}, false);
			return xhr;
		},
		type:"POST",
		url:uploadURL3,
		dataType:"json",
		data:fd,
		contentType:false,
		processData:false,
		cache: false,
		success:function(res)
		{
			if(res.status==0)
			{
				$("input[name='special_assistance_doc']").after("<div class='error_msg'><span><i class='fa fa-exclamation-circle' aria-hidden='true'></i>&nbsp; "+res.error+"</span></div>");
			}
			else if(res.status==1)
			{
				$("#progress").css("opacity",0);
				$("#uploadSuccess").html('<i class="fa fa-check-circle" aria-hidden="true" style="color:#009900; font-size:16px"></i>');
			}
		}
	});	
}

function uploadFile4()
{
	$("#progress").css("opacity",0);
	
	var fileInput = $("input[name='gap_year_certificate']");
	var files = fileInput.prop('files');
	var fd = new FormData();
	fd.append('file', files[0]);
	
	$.ajax
	({
		xhr: function()
		{
			var xhr = new window.XMLHttpRequest();
			//Upload progress
			xhr.upload.addEventListener("progress", function(evt){
				if (evt.lengthComputable)
				{
					var percentComplete = evt.loaded / evt.total;
					//Do something with upload progress
					$("#progress").css("opacity",1).attr("value",percentComplete);
				}
			}, false);
			//Download progress
			xhr.addEventListener("progress", function(evt){
				if (evt.lengthComputable)
				{
					var percentComplete = evt.loaded / evt.total;
					//Do something with download progress
					$("#progress").css("opacity",1).attr("value",percentComplete);
				}
			}, false);
			return xhr;
		},
		type:"POST",
		url:uploadURL4,
		dataType:"json",
		data:fd,
		contentType:false,
		processData:false,
		cache: false,
		success:function(res)
		{
			if(res.status==0)
			{
				$("input[name='gap_year_certificate']").after("<div class='error_msg'><span><i class='fa fa-exclamation-circle' aria-hidden='true'></i>&nbsp; "+res.error+"</span></div>");
			}
			else if(res.status==1)
			{
				$("#progress").css("opacity",0);
				$("#uploadSuccess").html('<i class="fa fa-check-circle" aria-hidden="true" style="color:#009900; font-size:16px"></i>');
			}
		}
	});	
}

function uploadFileCertifacte()
{
	$("#progress").css("opacity",0);
	
	var fileInput = $("input[name='isdi_summer_certifate']");
	var files = fileInput.prop('files');
	var fd = new FormData();
	fd.append('file', files[0]);
	
	$.ajax
	({
		xhr: function()
		{
			var xhr = new window.XMLHttpRequest();
			//Upload progress
			xhr.upload.addEventListener("progress", function(evt){
				if (evt.lengthComputable)
				{
					var percentComplete = evt.loaded / evt.total;
					//Do something with upload progress
					$("#progress").css("opacity",1).attr("value",percentComplete);
				}
			}, false);
			//Download progress
			xhr.addEventListener("progress", function(evt){
				if (evt.lengthComputable)
				{
					var percentComplete = evt.loaded / evt.total;
					//Do something with download progress
					$("#progress").css("opacity",1).attr("value",percentComplete);
				}
			}, false);
			return xhr;
		},
		type:"POST",
		url:uploadURLCerticate,
		dataType:"json",
		data:fd,
		contentType:false,
		processData:false,
		cache: false,
		success:function(res)
		{
			if(res.status==0)
			{
				$("input[name='isdi_summer_certifate']").after("<div class='error_msg'><span><i class='fa fa-exclamation-circle' aria-hidden='true'></i>&nbsp; "+res.error+"</span></div>");
			}
			else if(res.status==1)
			{
				$("#progress").css("opacity",0);
				$("#uploadSuccess").html('<i class="fa fa-check-circle" aria-hidden="true" style="color:#009900; font-size:16px"></i>');
			}
		}
	});	
}

//----------------------------------------------------------------------------------------------------------------------------------------------
function getStateCity(value,type,id='')
{
	console.log(value);
	console.log(type);
	$.ajax
	({
		type:"POST",
		url:StateCityURL,
		dataType:"json",
		data:{value:value,type:type},
		success:function(res)
		{
			$("#"+id).html(res.option);
		}
	});
}

function getStateCityPG(value,type)
{
	$.ajax
	({
		type:"POST",
		url:StateCityURL,
		dataType:"json",
		data:{value:value,type:type},
		success:function(res)
		{
			$("#pg-"+type).html(res.option);
		}
	});
}
function getStateCityPGDSE(value,type)
{
	$.ajax
	({
		type:"POST",
		url:StateCityURL,
		dataType:"json",
		data:{value:value,type:type},
		success:function(res)
		{
			$("#pgdse-"+type).html(res.option);
		}
	});
}
function getStateCityV2(value,type,id='',resetId='')
{
	console.log(value);
	console.log(type);
	console.log(id);
	// Reset the dependent (grandchild) dropdown so stale options from the
	// previous selection don't linger (e.g. old city when country changes).
	if(resetId){
		$("#"+resetId).html('<option selected disabled value="">Please select</option>');
	}
	$.ajax
	({
		type:"POST",
		url:StateCityURL,
		dataType:"json",
		data:{value:value,type:type},
		success:function(res)
		{
			$("#"+id).html(res.option);
		}
	});
}

function getStateCitySchool(value,type,id='')
{
	console.log(value);
	console.log(type);
	console.log(id);
	$.ajax
	({
		type:"POST",
		url:StateCitySchoolURL,
		dataType:"json",
		data:{value:value,type:type},
		success:function(res)
		{
			$("#"+id).html(res.option);
		}
	});
}


function getSchool(value,type,id='')
{
    
    var options = '<option value="">Please Select </option>';
    document.getElementById("school").innerHTML=options;
    document.getElementById("certification").innerHTML=options;
    document.getElementById("abbrivation").innerHTML=options;
    document.getElementById("specialisation").innerHTML=options;
    var academicYear = $('#academicYear').val();
    
	console.log(value);
	console.log(type);
	$.ajax
	({
		type:"POST",
		url:schoolURL,
		dataType:"json",
		data:{value:value,type:type,academicYear:academicYear},
		success:function(res)
		{
			$("#"+id).html(res.option);
		}
	});
}

function getCerticiate(value,type,id='')
{
    
    var options = '<option value="">Please Select </option>';
    document.getElementById("certification").innerHTML=options;
    document.getElementById("abbrivation").innerHTML=options;
    document.getElementById("specialisation").innerHTML=options;
    var school = $('#school').val();
    
	console.log(value);
	console.log(type);
	$.ajax
	({
		type:"POST",
		url:certificateURL,
		dataType:"json",
		data:{value:value,type:type,school:school},
		success:function(res)
		{
			$("#"+id).html(res.option);
		}
	});
}

//----------------------------------------------------------------------------------------------------------------------------------------------
numericOnly();
function numericOnly()
{
  $(".numeric").keypress(function (e) {
		if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57))
		{
			return false;
		}
	});
}

function getAcedmic(value,type,id='')
{
    var school = "";
	console.log(value);
	console.log(type);
	$.ajax
	({
		type:"POST",
		url:AcedemicURL,
		dataType:"json",
		data:{value:value,type:type,school:school},
		success:function(res)
		{
			$("#"+id).html(res.option);
		}
	});
}


function getAbbrivationApp(value,type,id='')
{
    var school = $('#school').val();
    
    if (parseInt(value, 10) === 3 && school== 7) {
         window.location.replace("https://www.atlasuniversity.edu.in/summerdesign/");
        return;
    }
    
    if (parseInt(value, 10) === 3 && school== 8) {
         window.location.replace("https://www.atlasuniversity.edu.in/summermgmt/");
        return;
    }
    
    if (parseInt(value, 10) === 3 && school== 13) {
         window.location.replace("https://www.atlasuniversity.edu.in/summertech/");
        return;
    }
    
    if(value == 2 || value == 4){
        $('.hideClass').removeClass('hideClass1');
        $('.hideClass').addClass('hideClass2');
        $("#ten5").css({'display':'none'});
        $("#ten").css({'display':'none'});
        $("#gd1").css({'display':'block'});
        $("#gd2").css({'display':'block'});
        $("#gd3").css({'display':'block'});
        $("#linID").css({'display':'block'});
        $("#sla").css({'display':'none'});
    }else{
        $('.hideClass').addClass('hideClass1');
        $('.hideClass').removeClass('hideClass2');
        $("#ten5").css({'display':'block'});
        $("#ten").css({'display':'block'});
        $("#gd1").css({'display':'none'});
        $("#gd2").css({'display':'none'});
        $("#gd3").css({'display':'none'});
        $("#linID").css({'display':'none'});
        $("#sla").css({'display':'block'});
    }
	console.log(value);
	console.log(type);
	$.ajax
	({
		type:"POST",
		url:AbbrivationURL,
		dataType:"json",
		data:{value:value,type:type,school:school},
		success:function(res)
		{
			$("#"+id).html(res.option);
		}
	});
}

function getAbbrivation(value,type,id='')
{
    var school = $('#school_un').val();
	console.log(value);
	console.log(type);
	$.ajax
	({
		type:"POST",
		url:AbbrivationURL,
		dataType:"json",
		data:{value:value,type:type,school:school},
		success:function(res)
		{
			$("#"+id).html(res.option);
		}
	});
}


function getAbbrivation11(value,type,id='')
{
    var school = $('#school_un').val();
	console.log(value);
	console.log(type);
	$.ajax
	({
		type:"POST",
		url:AbbrivationURL1,
		dataType:"json",
		data:{value:value,type:type,school:school},
		success:function(res)
		{
			$("#"+id).html(res.option);
		}
	});
}


function getSpecialisation(value,type,id='')
{
   var school = $('#school_un').val();
   var certification = $('#certification_un').val();
   
	console.log(value);
	console.log(type);
	$.ajax
	({
		type:"POST",
		url:SpecialisationURL,
		dataType:"json",
		data:{value:value,type:type,school:school,certification:certification},
		success:function(res)
		{
			$("#"+id).html(res.option);
		}
	});
}


function getSpecialisationApp(value,type,id='')
{
   var school = $('#school').val();
   
    if (school== 17) {
         window.location.replace("https://admission-portal.atlasonline.edu.in/");
        return;
    }
   
   var certification = $('#certification').val();
   $('#specialisationText').text('Specialisation');
   if(value == 15 &&  school == 8){
       $('#specialisationText').text('Duration');
   }
   
   if(value == 282 || value == 330){
        $("#math_question").css({'display':'block'});
        console.log(value);
        console.log("block" + value);
   }else{
        $("#math_question").css({'display':'none'});
        console.log("none" + value);
   }
 
	console.log(value);
	console.log(type);
	$.ajax
	({
		type:"POST",
		url:SpecialisationURL,
		dataType:"json",
		data:{value:value,type:type,school:school,certification:certification},
		success:function(res)
		{
			$("#"+id).html(res.option);
		}
	});
}
function get_acedemic_value2(value,type,id='')
{
   var school = $('#school1').val();
   var certification = $('#certification2').val();
 
	console.log(certification);
	console.log(type);
	$.ajax
	({
		type:"POST",
		url:AcedemicURL1,
		dataType:"json",
		data:{school:school,certification:certification},
		success:function(res)
		{
			$("#"+id).html(res.option);
		}
	});
}
function submitFooter()
{  
   var school = $('#school1').val();
   var certification = $('#certification2').val();
   var name1 = $('#name1').val();
   var email_id1 = $('#email_id1').val();
   var phone1 = $('#phone1').val();
   var city1 = $('#city1').val();
   var specialisation2 = $('#specialisation2').val();
 $("#enquiry_submit").html('<i class="fa fa-spin fa-spinner"></i> Please Wait..');
  $("#enquiry_submit").attr("disabled", true);
  if(school === "" || certification === "" || name1 === "" || email_id1 === "" || city1 === "" || specialisation2 === "" ){
    // string is empty, do something
    $("#output").html('All Fields are required');
    $("#enquiry_submit").html('Submit');
    $("#enquiry_submit").attr("disabled", false);
 }else{
    	console.log(certification);
    	

	$.ajax
	({
		type:"POST",
		url:formSubmit,
		dataType:"json",
		data:{school:school,certification:certification,name:name1,email_id:email_id1,phone:phone1,city:city1,specialisation:specialisation2},
		success:function(res)
		{
			window.location="https://atlasuniversity.edu.in/thankyouNew.php";
		}
	});
}

}

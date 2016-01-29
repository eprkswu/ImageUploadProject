$(function(){
	$("#btnUploadImage").click(function(e){
		e.preventDefault();
		var frm = document.frmUploadFile;
		frm.submit();
	});
});
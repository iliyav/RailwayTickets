document.addEventListener("deviceready", onDeviceReady, false);
var findStationUri="http://booking.uz.gov.ua/ru/purchase/station/";
var findTrainsUri="http://booking.uz.gov.ua/ru/purchase/search/";

// PhoneGap is ready
function onDeviceReady() {
    $.mobile.page.prototype.options.backBtnText = "Назад";
    $('#from_station').bind('change',stationChanged);
    $('#to_station').bind('change',stationChanged);
    $('#swap_stations').bind('click',swapStations);
    $('#search_button').bind('click',search);
    $('#stations').live( 'pagehide',function(event, ui){
  		$('#stations_list').html('');
	});
    $('#result').live('pagehide',function(event, ui){
  		$('#result_content').html('');
	});
    $('#result').live('pagebeforeshow',function(event, ui){
          $("#result").trigger("pagecreate");
	});
    checkConnection();
    document.addEventListener("offline", goneOffline, false);
    document.addEventListener("online", goneOnline, false);
}

function goneOffline(){
    alert("Соединение с интернетом отсутствует! Пожалуйста подключитесь к сети, чтобы использовать данное приложение.");
    $('#search_button').attr('disabled',true);
}

function goneOnline(){
    $('#search_button').attr('disabled',false);
}

function checkConnection(){
    var conn=navigator.network.connection.type;
    if(conn == Connection.UNKNOWN || conn == Connection.NONE){
        goneOffline();
        navigator.app.exitApp();
    }
}

function stationChanged(event){
    if(this.value.length>2){
        $.mobile.changePage($("#stations"));
        findStations(this.value,this.id);
    }
}

function findStations(text, target){
    var input_id=target;
	var uri=findStationUri+text+"/";
    $.mobile.showPageLoadingMsg();
	$.get(uri,{},
    function(data, textStatus, jqXHR){
        var list=document.getElementById('stations_list');
        list.innerHTML='';
        for(var i=0;i<data.value.length;i++){
            list.innerHTML+='<li><a href="#" data-rel="back" id="'+data.value[i].station_id+'" onclick="fillStationInput(\''+input_id+'\',\''+data.value[i].title+'\',\''+data.value[i].station_id+'\');">'+data.value[i].title+'</a></li>';
        }
        if(data.value.length==0){
        	list.innerHTML+='<li>Похожие станции не найдены</li>';
        }
        $('#stations_list').listview('refresh');
        $.mobile.hidePageLoadingMsg();
    }
    ,'json');
    
}

function showResultList(){
    $('#open_result_list').click();
}     

function fillStationInput(target,value,value_id){
    document.getElementById(target).value=value;
    document.getElementById(target+"_id").value=value_id;
}

function swapStations(){
    v=$('#from_station').val();
    $('#from_station').val($('#to_station').val());
    $('#to_station').val(v);
}

function search(){
    var post_data={
        "station_id_from":$('#from_station_id').val(),
        "station_id_till":$('#to_station_id').val(),
        "station_from":$('#from_station').val(),
        "station_till":$('#to_station').val(),
        "date_start":$('#date_from').val(),
        "time_from":$('#time_from').val(),
        "search":''
    };
    
    var post_data={
        "station_id_from":"2200001",
        "station_id_till":"2210700",
        "station_from":"Киев",
        "station_till":"Днепропетровск Главный",
        "date_start":"27.09.2012",
        "time_from":"00:00",
        "search":''
    };
    
    
    $.mobile.showPageLoadingMsg();
    $.post(findTrainsUri,
           post_data,
           function(data) {
               //alert(data.value);
               var target=$('#result_content');
               if(data.error===true){
               		target.append('<h3>'+data.value+'</h3>');   
               }
               else{
                   var places;
                   var places_layout;
                   var s="";
                   for(var i=0;i<data.value.length;i++){
                       places=0;
                       places_layout="";
                       for(var j=0;j<data.value[i].types.length;j++){
                           places_layout+='<div class="ui-block-a">'+data.value[i].types[j].title+'</div><div class="ui-block-b">'+data.value[i].types[j].places+'</div>';
                           places+=data.value[i].types[j].places;
                       }
                       //s+='<div data-role="collapsible" data-content-theme="e"><h3><div class="ui-grid-a"><div class="ui-block-a">'+data.value[i].num+'</div><div class="ui-block-b">свободных мест: '+places+'</div></div></h3>';
                       s+='<div data-role="collapsible" data-content-theme="e"><h3>'+data.value[i].num+'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;свободных мест: '+places+'</h3>';
                       s+='<p><strong>Маршрут:</strong> '+data.value[i].from.station+' -> '+data.value[i].till.station+'</p>';
                       start=new Date(data.value[i].from.date*1000);
                       stop=new Date(data.value[i].till.date*1000);
                       s+='<p><strong>Отправление:</strong> '+formatDate(start)+'</p>';
                       s+='<p><strong>Прибытие:</strong> '+formatDate(stop)+'</p>';
                       s+='<p><strong>Свободные места:</strong><br><div class="ui-grid-a">'+places_layout+'</div></p>';
                       s+='</div>';
                       
                       //target.append('<div data-role="collapsible"><h3>'+data.value[i].num+'</h3><p></p></div>');
                    }
                   target.append(s);
               }
               $.mobile.changePage($("#result"));
               $.mobile.hidePageLoadingMsg();
			});
    return false;
}

function formatDate(date){
    result=date.getDate()+'.'+(date.getMonth()+1)+'.'+date.getFullYear()+' в '+date.getHours();
    minutes=date.getMinutes();
    if (minutes < 10){
		minutes = "0" + minutes;
	}
    result+=':'+minutes;
    return result;
}
           
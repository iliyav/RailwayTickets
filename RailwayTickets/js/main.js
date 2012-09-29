document.addEventListener("deviceready", onDeviceReady, false);
var findStationUri="http://booking.uz.gov.ua/ru/purchase/station/";
var findTrainsUri="http://booking.uz.gov.ua/ru/purchase/search/";
var HistoryMaxCount=10;

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
    $('#show_history').bind('click',showHistory);
    $('#del_history').bind('click',delHistory);
    checkConnection();
    document.addEventListener("offline", goneOffline, false);
    document.addEventListener("online", goneOnline, false);
    //window.localStorage.clear();
    var history_count=window.localStorage.getItem("history_count");
    if(history_count=="undefined") window.localStorage.setItem("history_count",0);
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
    /*
    var post_data={
        "station_id_from":"2200001",
        "station_id_till":"2210700",
        "station_from":"Киев",
        "station_till":"Днепропетровск Главный",
        "date_start":"27.09.2012",
        "time_from":"01:00",
        "search":''
    };
    */
    if(!checkFormFill()) return false;
    saveSearchToHistory(post_data);
    $.mobile.showPageLoadingMsg();
    $.post(findTrainsUri,
           post_data,
           function(data) {
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
                       
                    }
                   target.append(s);
               }
               $.mobile.changePage($("#result"));
               $.mobile.hidePageLoadingMsg();
			});
    return false;
}

function saveSearchToHistory(data){
    var history_count=Number(window.localStorage.getItem("history_count"));
    var history_next=0;
    if(history_count<HistoryMaxCount){
        history_next=history_count+1;
    }else{
        for(var i=HistoryMaxCount-1;i>0;i--){
            window.localStorage.setItem("history"+i,window.localStorage.getItem("history"+(i+1)));
        }
        history_next=HistoryMaxCount;
    }
    window.localStorage.setItem("history"+history_next,serializeData(data));
    window.localStorage.setItem("history_count",history_next);
    return true;
}

function showHistory(){
    var history_count=Number(window.localStorage.getItem("history_count"));
    if(history_count==0){
        $('#history_list').html('<li>Поисковых запросов еще не было.</li>');
        return true;
    }
    var history_list=document.getElementById('history_list');
    history_list.innerHTML='';
    for(var i=history_count;i>0;i--){
        search_request=window.localStorage.getItem("history"+i);
        data=unserializeData(search_request);
        history_list.innerHTML+='<li><a href="#" data-rel="back" onclick="fillSearchForm(\''+search_request+'\');">'+data['station_from']+'->'+data['station_till']+'<br> '+data['date_start']+'</a></li>';
    }
    $('#history_list').listview('refresh');
}

function delHistory(){
    window.localStorage.clear();
    window.localStorage.setItem('history_count',0);
    showHistory();
}

function fillSearchForm(search_request){
    data=unserializeData(search_request);
    document.getElementById('from_station').value=data['station_from'];
    document.getElementById('from_station_id').value=data['station_id_from'];
    document.getElementById('to_station').value=data['station_till'];
    document.getElementById('to_station_id').value=data['station_id_till'];
    document.getElementById('date_from').value=data['date_start'];
    $('#time_from').val(data['time_from']);
    return true;
}

function serializeData(data){
    var data_string="";
    for(var key in data){
        data_string+=key+'=>'+data[key]+';';
    }
    return data_string;
}

function unserializeData(ser){
    var pos=ser.indexOf(';');
    var result=new Object();
    while(pos!=-1){
        s=ser.substring(0,pos);
        delim=s.indexOf('=>');
        key=s.substring(0,delim);
        val=s.substring(delim+2);
        result[key]=val;
        ser=ser.substring(pos+1);
        pos=ser.indexOf(';');
    }
    return result;
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

function checkFormFill(){
    return $('#from_station_id').val()!='' && $('#to_station_id').val()!='' && $('#date_from').val()!='';
}
           
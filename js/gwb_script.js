$(document).ready(function () {
	var i,m,u,d;

	var url = "http://21.gwbstats.appspot.com/gwb.json";
	
	var users = {
		all: {},
		index: []
	};
	var photos = {
		all: {},
		unguessed: []
	};
	var month = {};	
	var lastmonth = {};	
	
	var q = {
		day:32,
		month:''
	};
	
	// >>>>>>>>>>>>>>>>>>>>>>>>>>>> recent months
	var months = ['--','JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC',];
	var countBack = function(mString){
		var mArray = mString.split('-');
		var mi,yi,link,html='';
		for(i = 0; i<6; i++ ){
			mi = mArray[1] - i;
			yi = mArray[0]
			if (mi < 1){
				mi += 12;
				yi -= 1;
			}
			link = months[mi];
			mi = (mi<10)?"0"+mi:mi;
			html = '<a href="index.html?month='+yi+'-'+mi+'"> '+link+' </a>'+html;
//			console.log(yi+'-'+mi , link);
		}
		html += '<a href="#" class="tab"> " </a>';
		$('#monthTab').html(html);
	};
	
	// >>>>>>>>>>>>>>>>>>>>>>>>>>>> $(window).resize
	$(window).resize(function() {
		var h = $(window).height()-182;$('.table-wrapper').height(Math.max(h,331));
	});
	$(window).resize();

	// >>>>>>>>>>>>>>>>>>>>>>>>>>>> notEmpty
	var notEmpty = function(v){
		if(v===undefined || v === null){
			return 0;
		} else {
			return v;
		}
	};
	

	// >>>>>>>>>>>>>>>>>>>>>>>>>>>> getMonthString
	var getMonthString = function(d){
		var m = d.getMonth()+1;
		m = (m<10)?"0"+m:m;
		return d.getFullYear()+"-"+m;
	}
	
	// >>>>>>>>>>>>>>>>>>>>>>>>>>>> getParams
	var params={},s = location.search.slice(1);
	$.each(s.split('&'),function(i,e){
		var p = e.split('=');
		params[p[0]] = p[1];
	});
	
	// >>>>>>>>>>>>>>>>>>>>>>>>>>>> get queryDates
	var qDate = new Date();
	if(params.month !== undefined){
		q.month = params.month;
	} else {
		var today = new Date();
		qDate.setDate( qDate.getDate() - 10 );
		if(today.getMonth() == qDate.getMonth()){
			q.day = today.getDate()+1
		}
		q.month = getMonthString(qDate);
	}
	qDate = new Date(q.month) 
	qDate.setDate( qDate.getDate() - 20 );
	q.lastmonth = getMonthString(qDate);
	
	
	if(params.cached !== undefined){
		url = "data/month-"+q.month+".json";
		
		$('#monthTab a').each(function(e,i){
			if(!$(this).hasClass('tab')){
				$(this).attr('href',$(this).attr('href')+'&cached=1');
			}
		});
	};

	// >>>>>>>>>>>>>>>>>>>>>>>>>>>> create User
	var getUsers = function(d){
		var create = function(u){
			var user = {
				flickrId: u.flickrId,
				iconUrl: u.iconUrl,
				url: u.url,
				userName: u.userName,
				month: [],
				gummi: [],
				photos: []
			}
			return user;
		}
		
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> fill guesser
		for(var uId in d.guessers) {
			if(d.guessers.hasOwnProperty(uId)) {
				u = d.guessers[uId]
				users.index.push(uId);
				user = create(u);
				user.totalUploads = (d.uploadersTotalScore[u.flickrId])?d.uploadersTotalScore[u.flickrId]:0;
				user.totalUploadsGuessed = (d.uploadersTotalGuessed[u.flickrId])?d.uploadersTotalGuessed[u.flickrId]:0;
				user.totalUploadsGuessedPercent = Math.round((100*user.totalUploadsGuessed)/user.totalUploads);
				user.totalPoints = u.totalGuessed;
				user.totalScore = Math.round(Math.sqrt(user.totalPoints * user.totalUploads));
				users.all[uId] = user;
			}
		}
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> fill uploader
		for(var uId in d.uploaders) {
			if(d.uploaders.hasOwnProperty(uId)) {
				u = d.uploaders[uId]
				//users.byupload.push(uId);
				if (users.all[uId] === undefined){
					users.index.push(uId);
					user = create(u);
					user.totalUploads = u.totalUploads;
					user.totalUploadsGuessed = u.totalGuessed;
					user.totalUploadsGuessedPercent = Math.round((100*user.totalUploadsGuessed)/user.totalUploads);
					user.totalPoints = (d.guessersTotalScore[u.flickrId])?d.guessersTotalScore[u.flickrId]:0;
					//user.totalScore = Math.round(Math.sqrt(u.totalUploads));
					users.all[uId] = user;
				} else {
					user = users.all[uId];
					user.totalUploads = u.totalUploads;
					user.totalUploadsGuessed = u.totalGuessed;
					user.totalUploadsGuessedPercent = Math.round((100*user.totalUploadsGuessed)/user.totalUploads);
				}
				user.totalScore = Math.round(Math.sqrt(user.totalPoints * user.totalUploads));
				
			}
		}
	};

	// >>>>>>>>>>>>>>>>>>>>>>>>>>>> create User
	var countUsers = function(d){
		var guessers = {};
		users.lastindex = [];
		
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> fill guesser
		for(var uId in d.guessers) {
			if(d.guessers.hasOwnProperty(uId)) {
				guessers[uId] = d.guessers[uId]
				users.lastindex.push(d.guessers[uId]);
			}
		}
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> fill uploader
		for(var uId in d.uploaders) {
			if(d.uploaders.hasOwnProperty(uId) && guessers[uId] === undefined){
				users.lastindex.push(uId);
			}
		} 
		
		return users.lastindex.length;
	};

	// >>>>>>>>>>>>>>>>>>>>>>>>>>>> analyseMonth uploader
	var fillMonth = function(d,u){
		var m = {};
		
		// >>>> calculate score
		var gScore = notEmpty(d.guessersScore[u])+1; 
		var gVal = Math.min(q.day,gScore);
		var uScore = notEmpty(d.uploadersScore[u])+1;
		var uVal = Math.min(q.day,uScore);
		m.score = gVal*uVal;
		m.posX = 10*(gVal-1);
		m.posY = 10*(uVal -1);
		
		m.uploads = notEmpty(d.uploadersScore[u]);
		m.uploadsGuessed = notEmpty(d.uploadersGuessed[u]);
		if(m.uploads>0){
			m.uploadsGuessedPercent = Math.round((100*m.uploadsGuessed)/m.uploads);
		} else {
			m.uploadsGuessedPercent = "-";
		}
		
		m.totalUploads = notEmpty(d.uploadersTotalScore[u]);
		m.totalUploadsGuessed = notEmpty(d.uploadersTotalGuessed[u]);
		if(m.totalUploads>0){
			m.totalUploadsGuessedPercent = Math.round((100*m.totalUploadsGuessed)/m.totalUploads);
		} else {
			m.totalUploadsGuessedPercent = "-";
		}

		m.points = notEmpty(d.guessersScore[u])
		m.totalPoints = notEmpty(d.guessersTotalScore[u]);
		
		return m;
	};
		
	// >>>>>>>>>>>>>>>>>>>>>>>>>>>> analyse photos
	var getPopular = function(list,scope){
		var max = {
			vMax:0,cMax:0,fMax:0,
			vId:0,cId:0,fId:0,
			vSum:0,cSum:0,fSum:0,
			vAvg:0,cAvg:0,fAvg:0
		},p,l=[],best=[];
		if (list.length === 0){ return max; }

		$.each(list,function(i,e){
			if(scope === 'all'){
				p = list[i];
				photos.all[p.flickrId] = p;
				u = p.uploaderId;
				users.all[u].photos.push(p.flickrId);
				
				if(p.guesserId === undefined){
					photos.unguessed.push(p.flickrId);
				} else {
					users.all[p.guesserId].gummi.push(p.flickrId);
				}
				l.push(p.flickrId);
			} else if(scope === 'recent') {
				p = list[i];
				photos.all[p.flickrId] = p;
				l.push(p.flickrId);
			} else {
				p = photos.all[e];
				l.push(e);
			}
			max.fSum += p.nrFavs;
			max.cSum += p.nrComments;
			max.vSum += p.nrViews;
		});
		
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> most favorited
		l.sort(function(a, b) {
			return (photos.all[b].nrFavs - photos.all[a].nrFavs);
		});
		best.f = photos.all[l[0]];
		if(best.f.nrFavs>0){
			max.fMax = best.f.nrFavs;
			max.fId = best.f.flickrId;
		}
		
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> most commented
		l.sort(function(a, b) {
			return (photos.all[b].nrComments - photos.all[a].nrComments);
		});
		best.c = photos.all[l[0]];
		if(best.c === best.f && l.length>1){
			best.c = photos.all[l[1]];
		}
		max.cMax = best.c.nrComments;
		max.cId = best.c.flickrId;
		
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> most viewed
		l.sort(function(a, b) {
			return (photos.all[b].nrViews - photos.all[a].nrViews);
		});
		best.v = photos.all[l[0]];
		if((best.v === best.f || best.v === best.c) && l.length>1){
			best.v = photos.all[l[1]];
		}
		if((best.v === best.f || best.v === best.c) && l.length>2){
			best.v = photos.all[l[2]];
		}
		
		max.vMax = best.v.nrViews;
		max.vId = best.v.flickrId;
				
		max.fAvg = Math.round(10*(max.fSum/l.length))/10; 
		max.cAvg = Math.round(10*(max.cSum/l.length))/10;
		max.vAvg = Math.round(10*(max.vSum/l.length))/10;
		
		return max;
	};
	
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> fillPopular
	var fillPopular = function(eId,max){
	
		var $el = $(eId+' .maxviews');
		var $elA = $el.find('a');
		if(max.vId !== 0){
			$el.find('.count').text(max.vMax+' Views');
			$elA.css('background-image','url('+photos.all[max.vId].thumbsUrl.replace(/_t./,'_m.')+')');
			$elA.attr('title',users.all[photos.all[max.vId].uploaderId].userName +": " + photos.all[max.vId].title);
			$elA.attr('href',photos.all[max.vId].url);
		} else {
			$el.find('.count').text('--');
			$elA.css('background-image','url(gui/missing.jpg)');
			$elA.attr('title','');
			$elA.attr('href','#');
		}
		$elA.html('');
		
		$el = $(eId+' .maxcomments');
		$elA = $el.find('a');
		if(max.cId !== 0){
			$el.find('.count').text(max.cMax+' Comments');
			$elA.css('background-image','url('+photos.all[max.cId].thumbsUrl.replace(/_t./,'_m.')+')');
			$elA.attr('title',users.all[photos.all[max.cId].uploaderId].userName +": " + photos.all[max.cId].title);
			$elA.attr('href',photos.all[max.cId].url);
		} else {
			$el.find('.count').text('--');
			$elA.css('background-image','url(gui/missing.jpg)');
			$elA.attr('title','');
			$elA.attr('href','#');
		}
		$elA.html('');
		
		$el = $(eId+' .maxfavs');
		$elA = $el.find('a');
		if(max.fId !== 0){
			$el.find('.count').text(max.fMax+' Favs');
			$elA.css('background-image','url('+photos.all[max.fId].thumbsUrl.replace(/_t./,'_m.')+')');
			$elA.attr('title',users.all[photos.all[max.fId].uploaderId].userName +": " + photos.all[max.fId].title);
			$elA.attr('href',photos.all[max.fId].url);
		} else {
			$el.find('.count').text('--');
			$elA.css('background-image','url(gui/missing.jpg)');
			$elA.attr('title','');
			$elA.attr('href','#');
		}
		$elA.html('');
	};
	
	var compareToAvg = function(a,b){
		var direction = ((a-b) > 0)? 'hi': 'lo',
			delta = Math.abs(a-b),
			percentage = Math.round((100*delta)/b)
			change = direction + "-" + Math.min(5,Math.floor(percentage/50));
		return change;
	}
	
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> showUser
	var showUser = function(uId,nav){
		var user = users.all[uId];
		fillPopular('#maxuserphotos',user.max);
		
		$('#userHeader .usericon').css({'background-image':'url('+user.iconUrl+')'});
		$('#userHeader .username').text(user.userName);
		$('#userHeader .score').text(user.month.score);
		$('#userHeader .score')[0].className = "score " + compareToAvg(Math.sqrt(user.month.score),8);
		$('#userHeader .uploads').text(user.month.uploads);
		$('#userHeader .uploads').attr('title',"(ø = "+Math.round(month.uploads/month.players)+")");
		$('#userHeader .uploads')[0].className = "uploads " + compareToAvg(user.month.uploads,month.uploads/month.players);
		$('#userHeader .guessed').text(user.month.uploadsGuessedPercent);
		$('#userHeader .guessed').attr('title',"(ø = "+month.guessedPercent+")");
		$('#userHeader .guessed')[0].className = "guessed " + compareToAvg(user.month.uploadsGuessedPercent,month.guessedPercent);
		$('#userHeader .points').text(user.month.points);
		$('#userHeader .points').attr('title',"(ø = "+Math.round(month.guessed/month.players)+")");
		$('#userHeader .points')[0].className = "points " + compareToAvg(user.month.points,month.guessed/month.players);
		$('#userHeader .views').text(user.max.vAvg);
		$('#userHeader .views').attr('title',"(ø = "+photos.max.vAvg+")");
		$('#userHeader .views')[0].className = "views " + compareToAvg(user.max.vAvg,photos.max.vAvg);
		$('#userHeader .comments').text(user.max.cAvg);
		$('#userHeader .comments').attr('title',"(ø = "+photos.max.cAvg+")");
		$('#userHeader .comments')[0].className = "comments " + compareToAvg(user.max.cAvg,photos.max.cAvg);
		$('#userHeader .favs').text(user.max.fAvg);
		$('#userHeader .favs').attr('title',"(ø = "+photos.max.fAvg+")");
		$('#userHeader .favs')[0].className = "favs " + compareToAvg(user.max.fAvg,photos.max.fAvg);
		
		if(user.lastmonth){
			setTrendText($('#userHeader'),'score',user.month.score,user.lastmonth.score);
			setTrendText($('#userHeader'),'uploads',user.month.uploads,user.lastmonth.uploads);
			setTrendText($('#userHeader'),'guessed',user.month.uploadsGuessedPercent,user.lastmonth.uploadsGuessedPercent);
			setTrendText($('#userHeader'),'points',user.month.points,user.lastmonth.points);
/*
			setTrendText($('#userHeader'),'views',user.month.uploads,user.lastmonth.uploads);
			setTrendText($('#userHeader'),'comments',user.month.uploads,user.lastmonth.uploads);
			setTrendText($('#userHeader'),'favs',user.month.uploads,user.lastmonth.uploads);
*/
		}
		if(nav !== false){
			var headerPanes = $('#headerPanes').data('scrollable')
			headerPanes.seekTo(2);
		}
		
		$('#cluster div').removeClass('hot');
		$(user.dot).addClass('hot');
		
		
		var flickrlinkhtml = window.ich.flickrlinks(user);
		$('.userlinks').html(flickrlinkhtml);
		console.log(user,flickrlinkhtml)
		
		//console.log(user.max.vMax)photos.max.cAvg
		calcDays(user);
		
		user.pos = calcLocation(user.photos);
		user.posG = calcLocation(user.gummi);
		
		if (user.posG.max.x - user.posG.min.x <100) {
			$('.geo div.area-guessed').css({
				'left': 1.8*user.posG.min.x,
				'width': 1.78*(user.posG.max.x - user.posG.min.x) +1,
				'top': 180 - 1.8*user.posG.max.y,
				'height': 1.78*(user.posG.max.y - user.posG.min.y) +1,
			}).show();
		} else { $('.geo div.area-guessed').hide() }
		if (user.pos.max.x - user.pos.min.x <100) {
			$('.geo div.area-uploads').css({
				'left': 1.8*user.pos.min.x,
				'width': 1.78*(user.pos.max.x - user.pos.min.x) +1,
				'top': 180 - 1.8*user.pos.max.y,
				'height': 1.78*(user.pos.max.y - user.pos.min.y) +1,
			}).show();
		} else { $('.geo div.area-uploads').hide() }
		//console.log(user.pos)
		$('.geo a.dot').css({
			'left': 1.8*user.pos.mid.x,
			'top': 180 - 1.8*user.pos.mid.y,
		}).attr('href','https://maps.google.com/maps?hl=en&q='+user.pos.ll.latitude+","+user.pos.ll.longitude);
		
	};
	
	var calcDays = function(u){
		var uP = u.photos,
			uG = u.gummi,
			uMax = u.max,
			vFaktor = 1.7,
			cFaktor = 10,
			fFaktor = 10,
			gFaktor = 10,
			days = [-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
		$('.days .type_v').css({'height':vFaktor*photos.max.vAvg})
		$('.days .type_c').css({'height':cFaktor*photos.max.cAvg})
		$('.days .type_f').css({'height':fFaktor*photos.max.fAvg})
		$('.days .type_g').css({'height':gFaktor*1})
		$('.days .bar').css('height',0);
		$.each(uP,function(i,pId){
			var p = photos.all[pId],
				d = (new Date(p.dateAdded)).getDate(),
				vBar = $('.type_v .b_'+d+'_'+days[d]),
				cBar = $('.type_c .b_'+d+'_'+days[d]),
				fBar = $('.type_f .b_'+d+'_'+days[d]);
			days[d] += 1;
			vBar.css('height',(vFaktor*p.nrViews));
			cBar.css('height',(cFaktor*p.nrComments));
			fBar.css('height',(fFaktor*p.nrFavs));
			$(vBar).data('img',p);
			$(cBar).data('img',p);
			$(cBar).data('img',p);
		});
		days = [-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
		$.each(uG,function(i,pId){
			var p = photos.all[pId],
				d = (new Date(p.dateAdded)).getDate(),
				gBar = $('.type_g .b_'+d);
			days[d] += 1;
			gBar.css('height',(gFaktor*days[d]));
		});
		
	};
	
	var calcLocation = function(l){
		var pos = {
				s:{x:0,y:0},
				mid:{x:47,y:53},
				min:{x:100,y:100},
				max:{x:0,y:0}
			}
			n = 0;
		//var	max = {l:13.08973,r:13.756701,t:52.675445,b:52.338253},
		var	max = {l:13.08973,r:13.756701,t:52.711339,b:52.30512},
			x = max.r-max.l,
			y = max.t-max.b;
		var percent = function(v){
				v.x = Math.round(1000*(v.x-max.l)/x)/10;
				v.y = Math.round(1000*(v.y-max.b)/y)/10;
				return v;
			};
		$.each(l,function(i,pId){
			var p = photos.all[pId]
			if (p.latitude){
				n++;
				pos.s.x += p.longitude;
				pos.s.y += p.latitude;
				pos.max.x = Math.max(p.longitude,pos.max.x);
				pos.max.y = Math.max(p.latitude,pos.max.y);
				pos.min.x = Math.min(p.longitude,pos.min.x);
				pos.min.y = Math.min(p.latitude,pos.min.y);
				//if(p.latitude === pos.min.y) console.log(n,p.latitude+", "+p.longitude,p.url)
			}
		});
		if(n>0) {
			pos.s.x = pos.s.x/n;
			pos.s.y = pos.s.y/n;
			pos.ll = {latitude:pos.s.y,longitude:pos.s.x};
			pos.mid = percent(pos.s);
			pos.min = percent(pos.min);
			pos.max = percent(pos.max);
		} else {
			pos.ll = {latitude:52.520791,longitude:13.409417};
			pos.min = percent({x:13.08983,y:52.338353});
			pos.max = percent({x:13.756601,y:52.675345});
		}
		return pos;
	};
	
	var analyseStats = function(d){
		
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> collect uploaders and guessers
		getUsers(d);
		
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> create index
		$.each(users.index,function(i,uId){
			users.all[uId].month = fillMonth(d,uId);
		});
		
		users.index.sort(function(a, b) {
			if(users.all[b].month.score - users.all[a].month.score !== 0){
				return users.all[b].month.score - users.all[a].month.score;
			} else if(users.all[b].totalScore > users.all[a].totalScore){
				return -1;
			} else {
				return 1;
			}
		});
	
		month.id = d.month;
		month.error = d.error;
		month.uploads = d.total;
		month.guessed = d.guessed;
		month.guessedPercent = Math.round((100*d.guessed)/d.total);
		month.unguessed = d.unguessed;
		month.geotagged = d.geotagged;
		month.players = users.index.length;
		
		photos.max = getPopular(d.photos,'all');
		fillPopular('#maxphotos',photos.max);
		
		$('#homeTab .tab').text(month.id.substring(5));
		$('#groupHeader .month').text(month.id);
		$('#groupHeader .players').text(month.players);
		$('#groupHeader .uploads').text(month.uploads);
		$('#groupHeader .guessed').text(month.guessedPercent);
		$('#groupHeader .geotagged').text(month.geotagged);
		$('#groupHeader .views').text(photos.max.vAvg);
		$('#groupHeader .comments').text(photos.max.cAvg);
		$('#groupHeader .favs').text(photos.max.fAvg);
		
		$('.days .type_v').append('<span>ø Views: '+photos.max.vAvg+'</span>');
		$('.days .type_c').append('<span>ø Comments: '+photos.max.cAvg+'</span>');
		$('.days .type_f').append('<span>ø Favs: '+photos.max.fAvg+'</span>');
		$('.days').append('<span>Gummipunkte</span>');
		$('.days span').mouseenter(function(){
			$(this).css('z-index',0);
		})
		$('.days').mouseenter(function(){
			$(this).find('span').css('z-index',3);
		})
		
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> build table
		//console.log($('#userentry').html())
		//window.ich.addTemplate('userentry', document.getElementById('userentry').innerHTML)

		var pClassScore = 1024;
		var lastScore = 1025;
		var dot = {};
		var top = true;
		var pos = 0;
		$.each(users.index,function(i,uId){
			user = users.all[uId];
			score = user.month.score;
			user.max = getPopular(user.photos);
			
								// >>>> grouping of list
			if(score < pClassScore){
				pClassScore = pClassScore/2;
				user.border="topBorder";
			}
			user.tdclass="sc"+pClassScore;
			
								// >>>> ranking position
			var visPos = "";
			if(score < lastScore){
				pos = 1+i;
				visPos = pos;
				lastScore = score;
			}
			user.position=pos;
			user.vPosition=visPos;
			
								// >>>> max value = diamond
				if (score < 1024){
					top = false;
				}
			user.vScore = (top)?"(":score;
			
								// >>>> use template and add to markup
			var userMarkup = window.ich.userentry(user);
        	$('#ranking').append(userMarkup);
        	$(userMarkup).data('user',user);
        	$(userMarkup).mouseenter(function(){
        		var d = $(this).data('user');
				$('#highDot').css({
					'display':'block',
					'left':(d.month.posX),
					'top':(311 - d.month.posY)
				});
        	}).mouseleave(function(){
				$('#highDot').css({'display':'none'});
        	}).click(function(){
        		var id = $(this).data('user').flickrId;
        		showUser(id);
				$('#tableheader').fadeOut();
				$('#ranking tr').removeClass('current');
				$(this).addClass('current');
        	});
        	user.row = userMarkup;
        	
								// >>>> create Dot
        	dot = $('<div class="dot">●</div>').appendTo('#cluster');
        	$(dot).attr({
        		'title':user.userName
        	}).data({
        		'user':user.flickrId
        	}).css({
				'left':(5 +user.month.posX),
				'top':(315 - user.month.posY)
			}).click(function(e,i){
				$('#cluster .info').hide();
				showUser($(this).data('user'));
			});
			user.dot = dot;
		});
		
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> sort unguessed
		photos.unguessed.sort(function(a, b) {
			if(photos.all[a].nrComments - photos.all[b].nrComments !== 0){
				return photos.all[a].nrComments - photos.all[b].nrComments;
			} else if(photos.all[a].nrViews > photos.all[b].nrViews){
				return -1;
			} else {
				return 1;
			}
		});
		
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> make unguessed-List
		var mTarget = $('<ul />');
		$('#unguessedphotos .items').append(mTarget);
		//console.log(mTarget)
		$.each(photos.unguessed,function(i,e){
			//console.log(photos.all[e].nrComments,i,e);
			var p = photos.all[e];
			var pList = {
				url: p.url,
				username: users.all[p.uploaderId].userName,
				title: p.title,
				thumb: p.thumbsUrl,
				count: p.nrComments
			}
			var imgMarkup = window.ich.imglistentry(pList);
			mTarget.append(imgMarkup);
			
			
			if(i%3==2){
				mTarget = $('<ul />');
				$('#unguessedphotos .items').append(mTarget);
			}
		})
		
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> make unguessed scrollable
		$('#unguessedphotos .items').width(151*photos.unguessed.length)
		$('#unguessedphotos').scrollable({
			next:'.nextList',
			prev:'.prevList',
			onSeek: function(e,i){
				var items = $('#unguessedphotos ul').eq(i).find('a');
				$.each(items,function(){
					var url = $(this).data('img').replace(/_t./,'_m.');
					$(this).css('background-image','url('+url+')');
					$(this).html('');

				});
			}
		});
		var unguessedphotos = $('#unguessedphotos').data('scrollable');
		
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> make header scrollable
		$('#headerPanes').scrollable({
			vertical:true,
			onSeek: function(e,i){
				//console.log(this,e,i)
				if(i===1){
					unguessedphotos.seekTo(0);
				}
				closeMonths();
			},
			onBeforeSeek: function(e,i){
				closeMonths();
			}
		}).navigator({
			navi: "#headerTabs",
			naviItem: 'a',
			activeClass: 'current',
			history: true
		
		});
		
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> make months expandable
		var headerPanes = $('#headerPanes').data('scrollable');
		
		countBack(q.month);
		$('#monthTab a.tab').click(function(){
			var x = -235;
			if($('#monthTab').position().left < 0){x = 0;}
			$('#monthTab').animate({left: x});
			return false;
		});
		var closeMonths = function(){
			if($('#monthTab').position().left === 0){
				$('#monthTab').animate({left: -235});
			}
		};

		$('#ranking').mouseenter(function(){
			$('#tableheader').fadeIn();
		}).mouseleave(function(){
			$('#tableheader').fadeOut();
		});
		$('section').mouseenter(function(){
			closeMonths();
		});
		$('body').click(function(){
			closeMonths();
		});
		$('#cluster').mouseenter(function(){
			$('#cluster .info').show();
		}).mouseleave(function(){
			$('#cluster .info').hide();
		});
		
		u = Math.floor(Math.random() * users.index.length);
		showUser(users.index[u],false);
		
		setTimeout(function(){
			$.each(users.index,function(i,e){
				var user = users.all[e],
					cell = $(user.row).find('.icon span');
					cell.css({'background-image':'url('+user.iconUrl+")"});
			});
		},500)
		
		console.log(users,d)
	};
	
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> setTrendText
	var setTrendText = function(p,clss,val,prvVal){
		var el = p.find('.'+clss+'-trend');
		var c = compareToAvg(val,prvVal);
		var span = $('<span> ('+prvVal+')</span>')
		if(val > prvVal){
			el.text('&');
			el[0].className = clss + "-trend trend hi "+c;
		} else if(val < prvVal){
			el.text('\'');
			el[0].className = clss + "-trend trend lo "+c;
		} else {
			el.text(' ');
		}
		el.append(span);
	};
	
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> getLastMonth
	var getLastMonth = function(){
		if(params.cached !== undefined){
			url = "data/month-"+q.lastmonth+".json";
		}
		$.ajax({
			url:url + "?month="+q.lastmonth+"&callback=?",
			contentType: "application/json; charset=utf-8",
			dataType: "jsonp",
			jsonpCallback: "doMonth"
		}).done(function(data) {

			// >>>>>>>>>>>>>>>>>>>>>>>>>>>> create index
			$.each(users.index,function(i,uId){
				user = users.all[uId];
				user.lastmonth = fillMonth(data,uId);
				setTrendText(user.row,'score',user.month.score,user.lastmonth.score);
				setTrendText(user.row,'uploads',user.month.uploads,user.lastmonth.uploads);
				setTrendText(user.row,'points',user.month.points,user.lastmonth.points);
			});
			var lastPhotos = getPopular(data.photos,'recent');
			
			lastmonth.id = data.month;
			lastmonth.error = data.error;
			lastmonth.uploads = data.total;
			lastmonth.guessed = data.guessed;
			lastmonth.guessedPercent = Math.round((100*data.guessed)/data.total);
			lastmonth.unguessed = data.unguessed;
			lastmonth.geotagged = data.geotagged;
			lastmonth.players = countUsers(data);

			setTrendText($('#groupHeader'),'players',month.players,lastmonth.players);
			setTrendText($('#groupHeader'),'uploads',month.uploads,lastmonth.uploads);
			setTrendText($('#groupHeader'),'guessed',month.guessedPercent,lastmonth.guessedPercent);
			setTrendText($('#groupHeader'),'geotagged',month.geotagged,lastmonth.geotagged);
			setTrendText($('#groupHeader'),'views',photos.max.vAvg,lastPhotos.vAvg);
			setTrendText($('#groupHeader'),'comments',photos.max.cAvg,lastPhotos.cAvg);
			setTrendText($('#groupHeader'),'favs',photos.max.fAvg,lastPhotos.fAvg);
			
		});
	}
	
	var types = ['v','c','f','g'],pEl;
	for (v=0;v<4;v++){
		vEl = $('<div class="type_'+types[v]+' type"></div>').appendTo('.statList .days');
		for (i=1;i<32;i++){
			if (types[v] !== 'g'){
				for (p=0;p<3;p++){
					pEl = $('<div class="b_'+i+'_'+p+' p'+p+' bar"></div>').appendTo(vEl);
					pEl.css({'left':15+i*10});
					pEl.mouseenter(function(i,e){
						var p = $(this).data('img');
						if(p !== undefined){
							$('.highFoto').css({
								'background-image':'url('+p.thumbsUrl+')',
								'left':($(this).position().left)-20,
								'display':'block'
							});
							$('.highFoto').attr('href',p.url);
							if(p.guesserId === undefined){
								$('.highFoto span').show();
							} else {
								$('.highFoto span').hide();
							}
						} else {
							//console.log(this,pEl)
						}
					});
				}
			} else {
				pEl = $('<div class="b_'+i+' gBar bar"></div>').appendTo(vEl);
				pEl.css({'left':15+i*10});
			}
		}
	}
	$('.highFoto').mouseleave(function(){
		$(this).hide();
	})
	$('.statList').mouseleave(function(){
		$('.highFoto').hide();
	})
	$('#userTabs li').click(function(e,i){
		if(!$(this).hasClass('current')){
			$('#userTabs li').removeClass('current');
			$(this).addClass('current');
			if($(this).attr('id')==='photoTab'){
				$('.statList').fadeOut(200);
			} else {
				$('.statList').fadeIn(200);
			}
		}
	});
	
		//alert(122222011)
	
	
		// >>>>>>>>>>>>>>>>>>>>>>>>>>>> get currentData
	$.ajax({
		url:url + "?month="+q.month+"&callback=?",
		contentType: "application/json; charset=utf-8",
		dataType: "jsonp",
		jsonpCallback: "doMonth"
	}).done(function(data) {
		analyseStats(data);
		//console.log(photos.all['7660027358'])
		getLastMonth();
  	});
  });
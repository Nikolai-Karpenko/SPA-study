/**
 * Created by Nick on 03-Jan-17.
 */

window.onhashchange=SwitchToStateFromURLHash;
var lastPage = "Main";
var SPAStateH={};
var mainContainerDiv = $("#main_container");
var bodyRef = $("body");
function SwitchToStateFromURLHash()
{
    var URLHash=window.location.hash;

    var StateStr=URLHash.substr(1);

    if ( StateStr != "" ) {
        var PartsA = StateStr.split(".");
        SPAStateH = {pagename: PartsA[0]};
        if (SPAStateH.pagename === 'Article') {
            SPAStateH.book = PartsA[1];
            SPAStateH.article = PartsA[2];
        }
        else if (SPAStateH.pagename === 'Contents')
            SPAStateH.book = PartsA[1];
    }
    else
    {
        SPAStateH={pagename:'Main'};
        location.hash='Main';
    }

    switch ( SPAStateH.pagename )
    {
        case 'Main':
            toggleBodyColor(0);
            mainContainerDiv.load("/pages/main.html");
            break;
        case 'Article':
            toggleBodyColor(1);
            $.ajax("/pages/" + SPAStateH.book + "/" + SPAStateH.article + ".html",
                {
                    success: function(result){
                        makeArticleSidebarCrumbs(SPAStateH.book, SPAStateH.article, result)
                    },
                    complete:  function () {
                        MathJax.Hub.Queue(["Typeset", MathJax.Hub, "#mainContent"]);
                        jQuery.getScript("/scripts/salvattore.min.js");
                        $('[data-toggle="offcanvas"]').click(function () {
                            $('.row-offcanvas').toggleClass('active')
                        });
                        $(document).delegate(".disabled", "click", function () {return false});
                    }
                }
            );
            break;
        case 'Contents':
            toggleBodyColor(0);
            mainContainerDiv.load("/pages/"+SPAStateH.book+"/"+SPAStateH.book+".html");
            break;
    }
}

function KillParticles() {
    if (typeof killDrawAF !== "undefined" ) killDrawAF();
}

function toggleBodyColor(color) {
    if (color === 0)
        bodyRef.css("backgroundColor", "rgb(0, 0, 0)");
    else
        bodyRef.css("backgroundColor", "rgb(255, 255, 255)");
}

function makeArticleSidebarCrumbs(book, article, text) {
    var indexes = article.match(/(\D+)(\d+)?_?(\d+|(?:oppgaver))?/);
    var sessionStorageName = book + "_" + indexes[1];
    var contents = [];
    var bookName, chapterName, subChapterName;
    var fullArticle = "";
    var pills, breadcrumbs, sidebar;

    switch (book) {
        case "MatR1":
            bookName = "Matematikk R1";
            break;
        case "MatR2":
            bookName = "Matematikk R2";
            break;
        case "Fysikk":
            bookName = "Fysikk";
            break;
    }

    if (sessionStorage.getItem(sessionStorageName) !== null && JSON.parse(sessionStorage.getItem(sessionStorageName)) !== {} )
        contents = JSON.parse(sessionStorage.getItem(sessionStorageName));
    else {
        $.ajax("/pages/" + book + "/" + indexes[1] + ".json",
            {
                success: function (contentsArray) {
                    contents = contentsArray;
                    sessionStorage.setItem(sessionStorageName, JSON.stringify(contents));
                },
                async: false
            });
    }

    chapterName = contents[0];

    if (indexes[2] !== undefined)
        subChapterName = Object.keys(contents[indexes[2]])[0];

    // Breadcrumbs
    breadcrumbs = '<ol class="breadcrumb"> <li><a href="#" onclick="SwitchToMainPage(); return false">&alpha;</a></li>' +
            '<li><a  href="#" onclick="SwitchToContentsPage (\''+book+'\'); return false">'+bookName+'</a></li>';
    if (indexes[2] === undefined)
            breadcrumbs += '<li>'+chapterName+'</li>';
    else if (indexes[3] === undefined)
        breadcrumbs += '<li><a  href="#" onclick="SwitchToArticlePage (\''+book+'\',\''+indexes[1]+'\'); return false">'+chapterName+'</a></li>' +
            '<li>'+subChapterName+'</li>';
    else if (indexes[3] !== "oppgaver")
        breadcrumbs += '<li><a  href="#" onclick="SwitchToArticlePage (\''+book+'\',\''+indexes[1]+'\'); return false">'+chapterName+'</a></li>' +
            '<li><a  href="#" onclick="SwitchToArticlePage (\''+book+'\',\''+indexes[1]+indexes[2]+'\'); return false">'+subChapterName+'</a></li>' +
             '<li>'+contents[indexes[2]][subChapterName][indexes[3]-1]+'</li>';
    else if (indexes[3] === "oppgaver")
        breadcrumbs += '<li><a  href="#" onclick="SwitchToArticlePage (\''+book+'\',\''+indexes[1]+'\'); return false">'+chapterName+'</a></li>' +
            '<li><a  href="#" onclick="SwitchToArticlePage (\''+book+'\',\''+indexes[1]+indexes[2]+'\'); return false">'+subChapterName+'</a></li>' +
            '<li>'+'Oppgaver'+'</li>';
    breadcrumbs += '</ol>';
    
    // Pills
    if (indexes[2]) {
        pills = '<div class="col-xs-12">' +
            ' <ul class="nav nav-pills">';
        if (indexes[3] === undefined)
            pills += '<li class="active">' +
                ' <a href="#">Teori <span class="badge">' + contents[indexes[2]][subChapterName].length + '</span></a>' +
                ' </li>';
        else
            pills += ' <li>' +
                ' <a href="#" onclick="SwitchToArticlePage(\''+book+'\',\''+indexes[1]+indexes[2]+'\'); return false"class="chapters">' +
                'Teori <span class="badge">' + contents[indexes[2]][subChapterName].length + '</span></a>' +
        ' </li>';
        if (indexes[3] === "oppgaver")
            pills +=  ' <li class="disabled">' +
                ' <a href="#">Oppgaver</a>' +
                ' </li>';
        else
            pills += '<li>' +
                ' <a href="#" onclick="SwitchToArticlePage(\''+book+'\',\''+indexes[1]+indexes[2]+'_oppgaver\'); return false" class="chapters">Oppgaver</a>' +
        ' </li>';
        pills += '</ul>' +
            ' <br>' +
            ' </div>';
    }
    
    // Sidebar
    sidebar = '<div class="col-xs-6 col-sm-3 sidebar-offcanvas" id="sidebar">' +
        '        <div class="list-group" id="sidebarChapters">';
    for (i = 1; i < contents.length; i++) {
        if (typeof contents[i] === "object") {
            sidebar += '<a href="#" onclick="SwitchToArticlePage(\'' + book + '\', \'' + indexes[1] + i + '\'); return false" class="chapters list-group-item';
            if (i == indexes[2]) sidebar += ' active';
            sidebar += '">' + Object.keys(contents[i])[0] + '</a>';
        }
        else {
            sidebar += '<a href="#" class="list-group-item disabled';
            sidebar += '">' + contents[i] + '</a>';
        }
    }
    sidebar += '</div> </div>';
    fullArticle += '<div class="container" id="mainContent">' +
        ' <div class="row row-offcanvas row-offcanvas-right">' +
        ' <div class="col-xs-12 col-sm-9">' +
        ' <p class="pull-right visible-xs">' +
        ' <button type="button" class="btn btn-primary btn-xs" data-toggle="offcanvas" data-target="#sidebarChapters">Navigasjon</button>' +
        ' </p><div class="clearfix"></div> ';

    if (indexes[2] === undefined) {
        fullArticle +=  ' <div class="jumbotron"> ';
        fullArticle += breadcrumbs;
        fullArticle += text + '</div></div>';
        fullArticle += sidebar + '</div></div>';
    }
    else if (indexes[3] === undefined) {
        fullArticle +=  ' <div class="col-xs-12"> ';
        fullArticle += breadcrumbs + '</div>';
        if (indexes[2] != 1) fullArticle += pills;
        fullArticle += text + '</div>';
        fullArticle += sidebar + '</div></div>';
    }
    else {
        fullArticle += ' <div class="col-xs-12"> ';
        fullArticle += breadcrumbs;
        if (indexes[2] != 1) fullArticle += pills;
        fullArticle += text + '</div></div>';
        fullArticle += sidebar + '</div>';
    }
    $("#main_container").hide().html(fullArticle).fadeIn('500');
}

function SwitchToState(NewStateH)
{
    var StateStr=NewStateH.pagename;
    if ( NewStateH.pagename=='Article' )
        StateStr+="."+NewStateH.book+"."+NewStateH.article;
    else if ( NewStateH.pagename=='Contents' )
        StateStr+="."+NewStateH.book;
    location.hash=StateStr;
    lastPage = SPAStateH.pagename;
}

function SwitchToMainPage()
{
    SwitchToState( { pagename:'Main' } );
}

function SwitchToArticlePage(BookName, ArticleName)
{
    KillParticles();
    SwitchToState( { pagename:'Article', book: BookName, article:ArticleName } );
}

function SwitchToContentsPage(BookName)
{
    KillParticles();
    SwitchToState( { pagename:'Contents', book: BookName } );
}

SwitchToStateFromURLHash();
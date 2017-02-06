/**
 * Created by Nick on 10-Jan-17.
 */
var AjaxHandlerScript="http://fe.it-academy.by/AjaxStringStorage2.php";
var AJAXprefix = "KARPENKO_ARF_";

var modalDiv = $("#profileModalBody");
$("#profileModal").on("hide.bs.modal", clearKeyPresses);
var progress = {correct : 0, percentage : 0};
var currentQuestion = 0;
var maxQuestion, questionWeight, needsToLoad;
var results = [];
var currentFilename, currentAdr;
var adminProfile = false;
var testNames = [];
var memory, tmpString;

function checkAdminCreds(name, pass) {
    nameVal = $("#" + name).val();
    passVal = $("#" + pass).val();
    if (nameVal === "admin" && passVal === "admin") {
        adminProfile = true;
        hideLogin();
        $("#profileBtn").text("Admin");
    }
}

function refreshProfile() {
    clearKeyPresses();
    (localStorage["testsList"]) ? getTestsStorage() : getTestsList();
    showMainCtrls();
    $("#bigTitle").text("Min profil");
    $("#status").hide();
    $("#questionNumber").hide();
    if (!adminProfile) setProgress();
    if (adminProfile) getTestsList();
    needsToLoad = true;
}


function showMainCtrls() {
    if (adminProfile) $("#btnAdminCheckServer").show();
    $("#btnClose").show();
    $("#btnRefresh").show();
    $("#btnMiddle").hide();
    $("#btnLeft").hide();
    $("#btnRight").hide();
}

function hideMainCtrls() {
    $("#btnClose").hide();
    $("#btnRefresh").hide();
    $("#btnMiddle").show();
    $("#btnLeft").show();
    $("#btnRight").show();
}

function lockInterface() {
        $("#btnClose").addClass("disabled");
        $("#btnRefresh").addClass("disabled");
        $("#btnMiddle").addClass("disabled");
        $("#btnLeft").addClass("disabled");
        $("#btnRight").addClass("disabled");
}

function unlockInterface() {
    $("#btnClose").removeClass("disabled");
    $("#btnRefresh").removeClass("disabled");
    $("#btnMiddle").removeClass("disabled");
    $("#btnLeft").removeClass("disabled");
    $("#btnRight").removeClass("disabled");
}

function getTestsStorage() {
    var localList = localStorage["testsList"];
    if (localList && localList !== '') modalDiv.html(localList);
}

function getTestsList() {
    testNames = [];
    var allTests = "";
    var testName, adr, nQuestions;
    $.getJSON("/pages/tests.json", function (result) {
        for (var i = 0; i < result.length; i++) {
            testName = Object.keys(result[i])[0];
            adr = result[i][testName][0];
            nQuestions = result[i][testName][1];
            var fileName = adr.substring(28, adr.length - 10);
            testNames[i] = fileName;
            allTests += "<div class='progress'onclick='startTest(\""+adr+"\", "+nQuestions+", \""+testName+"\")'>" +
                "<div class='progress-bar progress-bar-success' role='progressbar' style='width: 0%'" +
                " id='"+fileName+"_PROGRESS'></div><span class='progress-type'>"+testName+"</span>" +
                "<span id='"+fileName+"_STATUS' class='progress-completed pull-right'></span>  </div>";
            
            localStorage["testsList"] = allTests;
            modalDiv.html(allTests);
            if (!adminProfile) setProgress();
            else $(".progress-bar-success").css('width', '100%');
            needsToLoad = true;
        }
    });
}

function startTest(adr, nQuestions, tName) {

    currentAdr = adr;
    $("#bigTitle").text(tName);

    if (adminProfile) {
        showStats(adr, nQuestions);
        return;
    }

    currentFilename = adr.substring(28, adr.length - 10);
    hideMainCtrls();
    enableKeyPresses();
    maxQuestion = nQuestions - 1;
    questionWeight = 100 / nQuestions;
    $("#questionNumber").text("Spørsmål " + (currentQuestion + 1)).show();
    checkProgress();
    var tempDiv = $("<div>");
    var tempObj;

    needsToLoad = (Object.keys(progress).length <= 2 && localStorage[currentFilename] !== undefined);
    if (needsToLoad) {
        progress = JSON.parse(localStorage[currentFilename]);
        checkProgress()
    }

    function Question(i){
        var self = this;
        self.index = i;
        self.answer;
        self.data;
        self.giveAnswer = function(a) {self.answer = a};
        self.setData = function() {self.data = $("#q" + self.index, tempDiv)};
    }

    if (results.length === 0)
        $.ajax(adr, {
            async : false,
            success : function (result){tempDiv.html(result)},
            complete : function (){
                for (var i = 1; i <= nQuestions; i++) {
                    tempObj = new Question(i);
                    tempObj.setData();
                    if (needsToLoad) tempObj.giveAnswer(progress[i]);
                    results.push(tempObj);
                    $("[type=radio]", tempObj.data).on("click", {question : tempObj}, handleRadio);

                }
                viewQuestion(results[0].data);
            }
        });
    else {
        viewQuestion(results[currentQuestion].data);
    }
}

function nextQuestion() {
    if (currentQuestion < maxQuestion) {
        viewQuestion(results[++currentQuestion].data);
        $("#questionNumber").text("Spørsmål " + (currentQuestion + 1));
        redelegateRadios();
    }
    else
        needsToLoad = false;
}

function prevQuestion() {
    if (currentQuestion === 0) {
        clearKeyPresses();
        refreshProfile();
    }
    else {
        viewQuestion(results[--currentQuestion].data);
        $("#questionNumber").text("Spørsmål " + (currentQuestion + 1));
        redelegateRadios();
    }
}

function viewQuestion(q) {
    modalDiv.html(q);
    if (needsToLoad && progress[currentQuestion + 1] !== undefined)
        $('[value='+progress[currentQuestion + 1]+']', '#q'+(currentQuestion + 1)).prop("checked", true);
    MathJax.Hub.Queue(["Typeset",MathJax.Hub,"profileModalBody"]);
}

function clearKeyPresses() { $(document).off("keydown", handleKeyPresses);}

function enableKeyPresses() { $(document).on("keydown", handleKeyPresses);}

function handleKeyPresses(EO) {
    switch (EO.keyCode) {
        case 37:
            prevQuestion();
            break;
        case 39:
            if (currentQuestion < maxQuestion)
                nextQuestion();
            break;
        case 27:
            $("#profileModal").modal('hide');
            break;
    }
}

function handleRadio(EO) {
    EO.data.question.giveAnswer(this.value);
    progress[EO.data.question.index] = this.value;
    checkProgress();
}



function redelegateRadios() {
    $("[type=radio]", results[currentQuestion].data).on("click", {question : results[currentQuestion]}, handleRadio);
}

function checkProgress() {
    var answered = Object.keys(progress).length - 2;
    var progressMade;
    if (answered > 0 && answered < (maxQuestion + 1))
        progressMade = answered * questionWeight;
    else if (answered == (maxQuestion + 1))
        progressMade = 100;
    else
        progressMade = 0;
    progress['percentage'] = progressMade;
    $("#status").text("  : " + progressMade + " %").show();
    localStorage[currentFilename] = JSON.stringify(progress);
}

function refreshProgressBar(filename, percentage) {
    $("#" + filename + "_PROGRESS").css("width", percentage + "%");
    $("#" + filename + "_STATUS").text(percentage + " %");
}

function setProgress() {
    var filenames = Object.keys(localStorage);
    var tmpName;
    for (var i = 0; i < filenames.length; i++) {
        tmpName = filenames[i];
        if (tmpName !== "testsList"){
            refreshProgressBar(tmpName, JSON.parse(localStorage[tmpName])["percentage"]);
        }
    }
}

function saveProgress() {
    localStorage[currentFilename] = JSON.stringify(progress);
    if (progress["percentage"] === 100) {
        sendAnswers();
    }
}

function sendAnswers() {
    var correctAnswers;
    var percentCorrect = 0;

    $.getJSON(currentAdr.substring(0,currentAdr.length - 4) + "json",
        {async: false},
        function(result) {
            correctAnswers = result;
            for (var i = 0; i < correctAnswers.length; i++) {
                if (progress[i + 1] == correctAnswers[i]) percentCorrect += questionWeight;
            }
            progress["correct"] = percentCorrect;
            localStorage[currentFilename] = JSON.stringify(progress);
            showResults(correctAnswers, percentCorrect);
        });

    sendToServer(currentFilename);
}

function showResults(correctAnswers, percentCorrect) {
    clearKeyPresses();
    var tmpIsCorrect;
    $("#status").hide();
    $("#questionNumber").hide();
    var resultHTML = "<h3>Riktig : " + percentCorrect + "%</h3>";
    for (var i = 0; i < correctAnswers.length; i++) {
        tmpIsCorrect = (results[i].answer == correctAnswers[i]);
        resultHTML += "<hr><div class='row'><div class='col-xs-12'><h4 style='font-style: italic'>" +
           "Spørsmål " + (i +1)+":</h4>" + $(results[i].data).find(".col-xs-12").html() +
           "</div></div><div class='row'>"+
           "<div class='col-xs-6 bg-info'>Riktig svar: " + $(results[i].data).find("[value=" + correctAnswers[i] + "]")[0].nextSibling.textContent.trim() + "</div>"+
           "<div class='col-xs-6"+((tmpIsCorrect) ? " bg-success" : " bg-danger")+"'>Ditt svar: " + $(results[i].data).find("[value=" + results[i].answer + "]")[0].nextSibling.textContent.trim() +"</div>"+
           "</div>";
    }
    $("#profileModalBody").html(resultHTML);
    showMainCtrls();
    $("#btnRefresh").hide();
    MathJax.Hub.Queue(["Typeset",MathJax.Hub,"profileModalBody"]);
}

function adminCheckServer() {
    if (adminProfile) {
        var report = "";
        var counter = 1;
        for (var i = 0; i < testNames.length; i++) {
            report += counter + ") " + testNames[i] + "\n";
            counter++;
        }
        tmpString = prompt(report);
        if (tmpString === null) return;
        if ($.inArray(tmpString, testNames) === -1) alert('"'+tmpString+'" not found!');
        else getServerStorage(tmpString);
        console.log(memory);
    }
}

function showStats(adr, nQuestions) {

    getServerStorage(adr.substring(28, adr.length - 10));
    $(".modal-dialog", "#profileModal").addClass('modal-lg');
    $("#btnRefresh").hide();
    setTimeout( function () {
        var stats = '<div class="table-responsive"><table class="table table-bordered table-striped table-hover">' +
            '<thead><tr><th>Navn</th><th>Riktg, %</th>';
        for (var i = 1; i <= nQuestions; i++)
            stats += '<th>' + i + '</th>';
        stats += '</tr></thead><tbody>';

        var correctAnswers;

        $.getJSON(adr.substring(0, currentAdr.length - 4) + "json",
            {async: false},
            function (result) {
                correctAnswers = result;
                for (key in memory) {
                    stats += '<tr>' +
                            '<td>'+key+'</td>'+
                            '<td>'+memory[key][0]+'</td>';
                    for (var i = 1; i < memory[key].length; i++) {
                        if (memory[key][i] == correctAnswers[i - 1])
                            stats += '<td class="success">' + memory[key][i] + '</td>';
                        else
                            stats += '<td class="danger">' + memory[key][i] + '</td>';
                    }
                    stats += '</tr>';
                }
                stats += '</tbody></table></div>';
                modalDiv.html(stats);
            }
        );
    }, 500);
}

var sendToServer = function(testName) {

    getServerStorage(testName);

    var cloneProgress = $.extend({}, progress);
    delete cloneProgress["percentage"];
    var tmpArray = [];
    tmpArray.push(cloneProgress["correct"]);
    delete cloneProgress["correct"];
    for (key in cloneProgress)
        tmpArray.push(Number(cloneProgress[key]));

    setTimeout(function() { memory[document.cookie.substring(9, 30).replace(/(%20)/g, '_')] = tmpArray; }, 1000);
    
    setTimeout(function() { setServerStorage(testName); }, 2000);
};


var getServerStorage = function(nameArg) {
    AJAXname = AJAXprefix + nameArg;
    lockInterface(); // Блокировка интерфейса перед запросом READ

    $.ajax(
        {
            url : AjaxHandlerScript, type : 'POST', cache : false,
            data : { f : 'READ', n : AJAXname },
            success : check_GetServerStorage,
            error : ErrorHandler,
            complete: unlockInterface // Разблокировка интерфейса после получения ответа
        }
    );
};

var check_GetServerStorage = function(AJAXresult) {

    if ( AJAXresult.error != undefined )
        alert(AJAXresult.error);
    else if ( AJAXresult.result != "" && AJAXresult.result != "{}")
    {
        memory = JSON.parse(AJAXresult.result);
    }
    else
    {
        memory = "empty";
        insertServerStorage(tmpString);
    }
};

var insertServerStorage = function(nameArg) {
    AJAXname = AJAXprefix + nameArg;
    $.ajax(
        {
            url : AjaxHandlerScript, type : 'POST', cache : false,
            data : { f : 'INSERT', n : AJAXname, v: '{}' },
            success : check_InsertServerStorage,
            error : ErrorHandler
        }
    );
};

var check_InsertServerStorage = function(AJAXresult) {
    if ( AJAXresult.error != undefined ) alert(AJAXresult.error);
};

var setServerStorage = function(nameArg) {
    AJAXname = AJAXprefix + nameArg;
    UpdatePassword=Math.random();
    lockInterface(); // Блокировка интерфейса перед запросом LOCKGET
    
    $.ajax(
        {
            url : AjaxHandlerScript, type : 'POST', cache : false,
            data : { f : 'LOCKGET', n : AJAXname, p : UpdatePassword },
            success : LockGetReady, error : ErrorHandler
        }
    );
};

var LockGetReady = function(AJAXresult) {
    if ( AJAXresult.error!=undefined )
        alert(AJAXresult.error);
    else
    {
        $.ajax(
            {
                url : AjaxHandlerScript, type : 'POST', cache : false,
                data : { f : 'UPDATE', n : AJAXname, v : JSON.stringify(memory), p : UpdatePassword },
                success : check_SetServerStorage,
                error : ErrorHandler,
                complete: unlockInterface // Разблокировка интерфейса после получения ответа
            }
        );
    }
};

var check_SetServerStorage = function(AJAXresult) {
    if ( AJAXresult.error != undefined ) alert(AJAXresult.error);
    else memory = {};
};

var ErrorHandler = function (jqXHR,StatusStr,ErrorStr) { alert(StatusStr+' '+ErrorStr); };
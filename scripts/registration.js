/**
 * Created by Nick on 07-Jan-17.
 */
$(function() {
    (document.cookie) ? hideLogin() : showLogin();
});

function hideLogin() {
    $('#navbarRightForm').hide();
    $('#navbarButtonGroup').hide();
    $('#profileBtn').show();
}

function showLogin() {
    $('#navbarRightForm').show();
    $('#navbarButtonGroup').show();
    $('#profileBtn').hide();
}

function saveCreds() {

    var userName = $('#user').val();
    if (!userName) return;
    setCookie('userName', userName);
    hideLogin();
    $('#regInvite').hide();
    $('#regButton').hide();
    $('#registration').modal('hide');
    $('#welcome').text("Velkommen, " + userName + "!");
}

function setCookie (name, value, options)
{
    options=options || {};
    var expires=options.expires;
    if (typeof expires == "number" && expires)
    {
        var d = new Date();
        d.setTime(d.getTime() + expires*1000);
        expires=options.expires=d;
    }
    if (expires && expires.toUTCString)
        options.expires=expires.toUTCString();
    value=encodeURIComponent(value);
    var updatedCookie=name+"="+value;
    for(var propName in options)
    {
        updatedCookie+="; "+propName;
        var propValue=options[propName];
        if (propValue !== true)
            updatedCookie+="="+propValue;
    }
    document.cookie=updatedCookie;
}
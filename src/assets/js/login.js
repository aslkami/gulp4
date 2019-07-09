
var aptchaChecked = '';
var ischeck = window.localStorage['remember'];
$(function () {
  $('#noRem').show();
  aptchaClick(); //获取本地存储账号密码

  if (typeof ischeck != 'undefined' && ischeck != null && ischeck == 'true') {
    var username = window.localStorage['inputUsername'];
    var password = window.localStorage['inputPassword'];
    $('#username').val(username);
    $('#password').val(password);
    $('#remImg').show();
    $('#noRem').hide();
  }

  var aptchaListener = function () {
    var kaptcha = $('#kaptcha').val().trim();

    if (kaptcha.length === 4) {
      if (aptchaChecked === kaptcha) {
        $('.login-form .fa-check-circle-o').removeClass("hidden");
        $('.login-form .fa-times-circle-o').addClass("hidden");
        $('.login-form .login-btn').removeClass("disabled").removeAttr("disabled");
      } else {
        checkAptcha();
      }
    } else {
      $('.login-form .fa-check-circle-o').addClass("hidden");
      $('.login-form .fa-times-circle-o').addClass("hidden");
      $('.login-form .login-btn').addClass("disabled").attr("disabled", "disabled");
    }
  };

  $('.login-form #kaptcha').keyup(aptchaListener);
  $('#loginForm').submit(function (e) {
    e.preventDefault();
    login();
  });
});

function aptchaClick() {
  $('.js-kaptcha').attr('src', API_HOST + '/getKaptcha?d=' + new Date() * 1);
  aptchaChecked = '';
  $('.login-form .fa-check-circle-o').addClass("hidden");
  $('.login-form .fa-times-circle-o').addClass("hidden");
  $('.login-form #kaptcha').val('').focus();
  $('.login-form .login-btn').addClass("disabled").attr("disabled", "disabled");
} // 校验验证码


function checkAptcha() {
  var kaptcha = $('#kaptcha').val().trim();
  $.ajax({
    type: 'POST',
    url: "/checkKaptcha?verifyCode=" + kaptcha,
    cache: false,
    dataType: "json",
    success: function (res) {
      if (!res.result) {
        $('.login-form .fa-check-circle-o').addClass("hidden");
        $('.login-form .fa-times-circle-o').removeClass("hidden");
        return;
      }

      $('.login-form .fa-check-circle-o').removeClass("hidden");
      $('.login-form .fa-times-circle-o').addClass("hidden");
      $('.login-form .login-btn').removeClass("disabled").removeAttr("disabled");
      aptchaChecked = kaptcha;
    },
    error: function () {
      layer.msg('请求失败');
    }
  });
} //本地存储


$('#remember').click(function () {
  if (!ischeck) {
    // 没有选中记住密码
    ischeck = true;
    $('#remImg').show();
    $('#noRem').hide();
  } else {
    localStorage.removeItem('inputPassword');
    window.localStorage['remember'] = false;
    ischeck = false;
    $('#remImg').hide();
    $('#noRem').show();
  }
}); //登录方法

function login() {
  // var username = $('#username').val().trim();
  // var password = $('#password').val().trim();
  // var kaptcha = $('#kaptcha').val().trim();
  var data = $('#loginForm').serializeObject()
  if (!data.username) {
    $('#username').focus();
    return tips.show('用户名不能为空');
  }

  if (!data.password) {
    $('#password').focus();
    return tips.show('密码不能为空');
  }
  if (!data.uservrifyCode) {
    $('#kaptcha').focus();
    return tips.show('验证码不能为空');
  }
  
  if (ischeck) {
    window.localStorage['inputPassword'] = data.password;
    window.localStorage['remember'] = true;
  }
  window.localStorage['inputUsername'] = data.username;
  data.password = $.md5(data.password) 
  $.ajax({
    type: 'POST',
    url: '/relogin',
    data: data,
    dataType: "json",
    contentType: 'application/x-www-form-urlencoded',
    success: function (res) {
      if (!res.result) {
        return tips.show(res.message);
      }
      window.location.href = 'index.html';
    },
    error: function () {
      tips.show('登录失败');
    }
  }); 
} 


var tips = {
  show: function (msg) {
    $('#tipCont').text(msg);
    $('.error-tips').show(100);
  },
  hide: function () {
    $('.error-tips').hide();
  }
};


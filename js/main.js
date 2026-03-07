document.addEventListener("DOMContentLoaded", function () {
  // ハンバーガーメニュー
  var menuToggle = document.getElementById("menuToggle");
  var nav = document.getElementById("nav");

  menuToggle.addEventListener("click", function () {
    menuToggle.classList.toggle("active");
    nav.classList.toggle("open");
  });

  // ナビリンクをクリックしたらメニューを閉じる
  var navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      menuToggle.classList.remove("active");
      nav.classList.remove("open");
    });
  });

  // ヘッダーのスクロール時のスタイル変更
  var header = document.getElementById("header");
  window.addEventListener("scroll", function () {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // スクロールアニメーション（Intersection Observer）
  var fadeElements = document.querySelectorAll(
    ".service-card, .about-grid, .news-item, .contact-grid"
  );

  fadeElements.forEach(function (el) {
    el.classList.add("fade-in");
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  fadeElements.forEach(function (el) {
    observer.observe(el);
  });

  // アクティブなナビリンクの更新
  var sections = document.querySelectorAll("section[id]");
  window.addEventListener("scroll", function () {
    var scrollPos = window.scrollY + 100;
    sections.forEach(function (section) {
      var top = section.offsetTop;
      var height = section.offsetHeight;
      var id = section.getAttribute("id");
      var link = document.querySelector('.nav-link[href="#' + id + '"]');
      if (link) {
        if (scrollPos >= top && scrollPos < top + height) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      }
    });
  });

  // お問い合わせフォーム送信
  var form = document.getElementById("contactForm");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    alert(
      "お問い合わせありがとうございます。\n内容を確認次第、担当者よりご連絡いたします。"
    );
    form.reset();
  });
});

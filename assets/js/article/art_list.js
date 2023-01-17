$(function () {
  var layer = layui.layer;
  var form = layui.form;
  var laypage = layui.laypage;
  //定义美化事件的过滤器
  template.defaults.imports.dataFormat = function (date) {
    const dt = new Date(date);

    var y = dt.getFullYear();
    var m = padZero(dt.getMonth() + 1);
    var d = padZero(dt.getDate());
    var hh = padZero(dt.getHours());
    var mm = padZero(dt.getMinutes());
    var ss = padZero(dt.getSeconds());
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  };

  //定义补零的函数
  function padZero(n) {
    return n > 9 ? n : '0' + n;
  }

  //定义一个查询的对象，将来请求数据的时候
  //需要将请求参数对象提交到服务器
  var q = {
    pagenum: 1, //页码值，默认请求第一页的数据
    pagesize: 2, //每页显示几条数据，默认每页显示2条
    cate_id: '', //文章分类的Id
    state: '', //文章的发布状态
  };
  initTable();
  initCate();
  //获取文章列表数据的方法
  function initTable() {
    $.ajax({
      method: 'GET',
      url: '/my/article/list',
      data: q,
      success: function (res) {
        if (res.status !== 0) {
          return layer.msg('获取文章列表失败！');
        }
        //使用模板引擎渲染页面数据
        var htmlStr = template('tpl-table', res);
        $('tbody').html(htmlStr);
        //调用渲染分页的方法
        renderPage(res.total);
      },
    });
  }

  //初始化文章分类的方法
  function initCate() {
    $.ajax({
      method: 'GET',
      url: '/my/article/cates',
      success: function (res) {
        if (res.status !== 0) {
          return layer.msg('获取分类数据失败！');
        }
        //调用模板引擎渲染分类的可选项
        var htmlStr = template('tpl-cate', res);
        $('[name=cate_id]').html(htmlStr);
        form.render();
      },
    });
  }

  //为筛选表单绑定submit事件
  $('#form-search').on('submit', function (e) {
    e.preventDefault();
    //获取表单中选中项的值
    var cate_id = $('[name=cate_id]').val();
    var state = $('[name=state]').val();
    //为查询参数对象q中对应的属性赋值
    q.cate_id = cate_id;
    q.state = state;
    //根据最新的筛选条件，重新渲染表格数据
    initTable();
  });

  //定义渲染分页的方法
  function renderPage(total) {
    //调用laypage.render()方法来渲染分页的结构
    laypage.render({
      elem: 'pageBox', //分页容器的id
      count: total, //数据总数，从服务端得到
      limit: q.pagesize, //每页显示几条数据
      curr: q.pagenum, //设置默认选中的分页
      limits: ['2', '3', '5', '10'],
      layout: ['count', 'limit', 'prev', 'page', 'next', 'skip'],
      //分页发生切换的时候触发回调
      //触发jump回调方式有两种
      //1.点击页码会执行回调
      //2.只要调用了laypage.render()就会执行回调
      jump: function (obj, first) {
        //可以通过first的值，来判断是通过哪种方式触发的jump
        //first===true 第二种方式
        //把最新的页码值赋值到q里进行查询
        q.pagenum = obj.curr;
        //把最新的条目数复制到q里
        q.pagesize = obj.limit;
        //根据最新的q进行表格渲染
        if (!first) initTable();
      },
    });
  }

  //通过代理的形式，为删除按钮绑定点击事件
  $('tbody').on('click', '.btn-delete', function () {
    var len = $('.btn-delete').length;
    var id = $(this).attr('data-id');
    //询问用户是否要删除数据
    layer.confirm('确认删除?', { icon: 3, title: '提示' }, function (index) {
      $.ajax({
        method: 'GET',
        url: '/my/article/delete' + id,
        success: function (res) {
          if (res.status !== 0) {
            return layer.msg('删除文章失败！');
          }
          layer.msg('删除文章成功！');
          //当数据删除完成后，需要判断当前页中是否还有剩余数据
          //如果没有数据了应让页码减1在重新调用initTable()
          if (len === 1) {
            q.pagenum = q.pagenum === 1 ? 1 : q.pagenum--;
            initTable();
          } else initTable();
        },
      });
      layer.close(index);
    });
  });

  //获取编辑点击按钮的id
  $('tbody').on('click', '.btn-edit', function (e) {
    var id = $(this).attr('data-id');
    location.href = '/article/art_pub.html?id=' + id;
  });
});

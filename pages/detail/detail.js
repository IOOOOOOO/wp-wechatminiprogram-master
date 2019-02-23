/*
 * 
 * WordPres版微信小程序
 * author: jianbo
 * organization: 守望轩  www.watch-life.net
 * github:    https://github.com/iamxjb/winxin-app-watch-life.net
 * 技术支持微信号：iamxjb
 * 开源协议：MIT
 *  *Copyright (c) 2017 https://www.watch-life.net All rights reserved.
 * 
 */


import config from '../../utils/config.js'
var Api = require('../../utils/api.js');
var util = require('../../utils/util.js');
var Auth = require('../../utils/auth.js');
var WxParse = require('../../wxParse/wxParse.js');
var wxApi = require('../../utils/wxApi.js')
var wxRequest = require('../../utils/wxRequest.js')

//const Zan = require('../../vendor/ZanUI/index')

var app = getApp();
let isFocusing = false
const pageCount = config.getPageCount;

import {
  ModalView
} from '../../templates/modal-view/modal-view.js'

Page({
  data: {
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    websitename: config.getWebsiteName,
    title: '文章内容',
    detail: {},
    commentsList: [],
    ChildrenCommentsList: [],
    commentCount: '',
    detailDate: '',
    commentValue: '',
    wxParseData: {},
    display: 'none',
    page: 1,
    isLastPage: false,
    parentID: "0",
    focus: false,
    placeholder: "请说出你的看法...",
    postID: null,
    scrollHeight: 0,
    postList: [],
    link: '',
    dialog: {
      title: '',
      content: '',
      hidden: true
    },
    content: '',
    isShow: false, //控制menubox是否显示
    isLoad: true, //解决menubox执行一次  
    sharehideshow: false,
    // menuBackgroup: false,
    // likeImag: "like.png",
    pinglunhaibaoindex: 99999,
    sharetype: 'bottom',
    isLiker: false,
    likeList: [],
    customColor: ['orange', 'cyan', 'red', 'blue', 'pink', 'green', 'yellow', 'grey', 'purple', 'olive', 'mauve', 'brown'],
    likeCount: 0,
    displayLike: 'none',
    replayTemplateId: config.getReplayTemplateId,
    replyhideshow: false,
    keyboardheight: 0,
    userid: "",
    toFromId: "",
    commentdate: "",
    flag: 1,
    logo: config.getLogo,
    enableComment: true,
    isLoading: false,
    total_comments: 0,
    isLoginPopup: false,
    openid: "",
    userInfo: {},
    system: ''

  },
  onLoad: function(options) {
    var self = this;
    self.getEnableComment();
    self.fetchDetailData(options.id);
    Auth.setUserInfoData(self);
    Auth.checkLogin(self);
    wx.getSystemInfo({
      success: function(t) {
        var system = t.system.indexOf('iOS') != -1 ? 'iOS' : 'Android';
        self.setData({
          system: system
        });

      }
    })
    new ModalView;
    // wx.onKeyboardHeightChange(res => {
    //   console.log('键盘高',res.height)
    //   self.setData({
    //     keyboardheight:res.height
    //   })
    // })
  },


  showLikeImg: function() {
    var self = this;
    var flag = false;
    var _likes = self.data.detail.avatarurls;
    var likes = [];
    console.log(self.data.detail)
    for (var i = 0; i < _likes.length; i++) {
      var avatarurl = "../../images/gravatar.png";
      if (i >= 10) {
        break;
      }
      if (_likes[i].avatarurl.indexOf('wx.qlogo.cn') != -1) {
        avatarurl = _likes[i].avatarurl;
      }
      likes[i] = avatarurl;
    }
    var temp = likes;
    self.setData({
      likeList: likes
    });
  },
  onReachBottom: function() {
    var self = this;
    if (!self.data.isLastPage) {
      console.log('当前页' + self.data.page);
      self.fetchCommentData();
      self.setData({
        page: self.data.page + 1,
      });
    } else {
      console.log('评论已经是最后一页了');
    }

  },
  onShareAppMessage: function(res) {
    this.ShowHideMenu();
    console.log(res);
    var invitations = this.data.userInfo.nickName ? this.data.userInfo.nickName : config.getWebsiteName
    console.log('邀请者是：',invitations)
    return {
      title:invitations + '邀您阅读：' + this.data.detail.title.rendered,
      path: 'pages/detail/detail?id=' + this.data.detail.id,
      imageUrl: this.data.detail.post_thumbnail_image,
      success: function(res) {
        // 转发成功
        console.log(res);
      },
      fail: function(res) {
        console.log(res);
        // 转发失败
      }
    }
  },
  gotowebpage: function() {
    var self = this;
    self.ShowHideMenu();
    var minAppType = config.getMinAppType;
    var url = '';
    if (minAppType == "0") {
      var url = '../webpage/webpage';
      wx.navigateTo({
        url: url + '?url=' + self.data.link
      })
    } else {
      self.copyLink(self.data.link);
    }

  },
  copyLink: function(url) {
    //this.ShowHideMenu();
    wx.setClipboardData({
      data: url,
      success: function(res) {
        wx.getClipboardData({
          success: function(res) {
            wx.showToast({
              title: '链接已复制',
              image: '../../images/link.png',
              duration: 2000
            })
          }
        })
      }
    })
  },
  clickLike: function(e) {
    var id = e.target.id;
    var self = this;
    // if (id == 'likebottom') {
    //   this.ShowHideMenu();
    // }

    if (self.data.openid) {
      var data = {
        openid: self.data.openid,
        postid: self.data.postID
      };
      var url = Api.postLikeUrl();
      var postLikeRequest = wxRequest.postRequest(url, data);
      postLikeRequest
        .then(response => {
          if (response.data.status == '200') {
            var _likeList = []
            var _like = self.data.userInfo.avatarUrl;
            _likeList.push(_like);
            var tempLikeList = _likeList.concat(self.data.likeList);
            var _likeCount = parseInt(self.data.likeCount) + 1;
            self.setData({
              likeList: tempLikeList,
              likeCount: _likeCount,
              displayLike: 'block'
            });
            wx.showToast({
              title: '谢谢点赞',
              icon: 'success',
              duration: 900,
              success: function() {}
            })
          } else if (response.data.status == '501') {
            console.log(response.data.message);
            wx.showToast({
              title: '谢谢，已赞过',
              icon: 'success',
              duration: 900,
              success: function() {}
            })
          } else {
            console.log(response.data.message);

          }
          self.setData({
            likeImag: "like-on.png",
            isLiker: true
          });
        })
    } else {
      Auth.checkSession(self, 'isLoginNow');

    }
  },
  getIslike: function() { //判断当前用户是否点赞
    var self = this;
    if (self.data.openid) {
      var data = {
        openid: self.data.openid,
        postid: self.data.postID
      };
      var url = Api.postIsLikeUrl();
      var postIsLikeRequest = wxRequest.postRequest(url, data);
      postIsLikeRequest
        .then(response => {
          if (response.data.status == '200') {
            self.setData({
              likeImag: "like-on.png",
              isLiker: true
            });

            console.log("已赞过");
          }

        })

    }
  },

  // goHome: function() {
  //   wx.switchTab({
  //     url: '../index/index'
  //   })
  // },
  praise: function() {
    this.ShowHideMenu();
    var self = this;
    var minAppType = config.getMinAppType;
    var system = self.data.system;
    if (minAppType == "0" && system == 'Android') {
      if (self.data.openid) {

        wx.navigateTo({
          url: '../pay/pay?flag=1&openid=' + self.data.openid + '&postid=' + self.data.postID
        })
      } else {
        Auth.checkSession(self, 'isLoginNow');
      }
    } else {

      var src = config.getZanImageUrl;
      wx.previewImage({
        urls: [src],
      });

    }
  },

  //获取是否开启评论设置
  getEnableComment: function(id) {
    var self = this;
    var getEnableCommentRequest = wxRequest.getRequest(Api.getEnableComment());
    getEnableCommentRequest
      .then(response => {
        if (response.data.enableComment != null && response.data.enableComment != '') {
          if (response.data.enableComment === "1") {
            self.setData({
              enableComment: true
            });
          } else {
            self.setData({
              enableComment: false
            });
          }

        };

      });
  },
  //获取文章内容
  fetchDetailData: function(id) {
    var self = this;
    var getPostDetailRequest = wxRequest.getRequest(Api.getPostByID(id));
    var res;
    var _displayLike = 'none';
    getPostDetailRequest
      .then(response => {
        res = response;
        WxParse.wxParse('article', 'html', response.data.content.rendered, self, 5);
        if (response.data.total_comments != null && response.data.total_comments != '') {
          self.setData({
            commentCount: "有" + response.data.total_comments + "条讨论"
          });
        };
        var _likeCount = response.data.like_count;
        if (response.data.like_count != '0') {
          _displayLike = "block"
        }

        self.setData({
          detail: response.data,
          likeCount: _likeCount,
          postID: id,
          link: response.data.link,
          detailDate: util.cutstr(response.data.date, 10, 1),
          //wxParseData: WxParse('md',response.data.content.rendered)
          //wxParseData: WxParse.wxParse('article', 'html', response.data.content.rendered, self, 5),
          display: 'block',
          displayLike: _displayLike,
          total_comments: response.data.total_comments

        });
        // 调用API从本地缓存中获取阅读记录并记录
        var logs = wx.getStorageSync('readLogs') || [];
        // 过滤重复值
        if (logs.length > 0) {
          logs = logs.filter(function(log) {
            return log[0] !== id;
          });
        }
        // 如果超过指定数量
        if (logs.length > 19) {
          logs.pop(); //去除最后一个
        }
        logs.unshift([id, response.data.title.rendered]);
        wx.setStorageSync('readLogs', logs);
        //end 

      })
      // .then(response => {
      //   wx.setNavigationBarTitle({
      //     title: res.data.title.rendered
      //   });

      // })
      .then(response => {
        var tagsArr = [];
        tagsArr = res.data.tags
        var tags = "";
        for (var i = 0; i < tagsArr.length; i++) {
          if (i == 0) {
            tags += tagsArr[i];
          } else {
            tags += "," + tagsArr[i];

          }
        }
        if (tags != "") {
          var getPostTagsRequest = wxRequest.getRequest(Api.getPostsByTags(id, tags));
          getPostTagsRequest
            .then(response => {
              self.setData({
                postList: response.data
              });

            })

        }
      }).then(response => { //获取点赞记录
        self.showLikeImg();
      }).then(resonse => {
        if (self.data.openid) {
          Auth.checkSession(self, 'isLoginLater');
        }

      }).then(response => { //获取是否已经点赞
        if (self.data.openid) {
          self.getIslike();
        }
      })
      .catch(function(error) {
        console.log('error: ' + error);

      })



  },
  //给a标签添加跳转和复制链接事件
  wxParseTagATap: function(e) {
    var self = this;
    var href = e.currentTarget.dataset.src;
    console.log(href);
    var domain = config.getDomain;
    //可以在这里进行一些路由处理
    if (href.indexOf(domain) == -1) {
      wx.setClipboardData({
        data: href,
        success: function(res) {
          wx.getClipboardData({
            success: function(res) {
              wx.showToast({
                title: '链接已复制',
                //icon: 'success',
                image: '../../images/link.png',
                duration: 2000
              })
            }
          })
        }
      })
    } else {
      var slug = util.GetUrlFileName(href, domain);
      if (slug == 'index') {
        wx.switchTab({
          url: '../index/index'
        })
      } else {
        var getPostSlugRequest = wxRequest.getRequest(Api.getPostBySlug(slug));
        getPostSlugRequest
          .then(res => {
            if (res.statusCode == 200) {
              if (res.data.length != 0) {
                var postID = res.data[0].id;
                var openLinkCount = wx.getStorageSync('openLinkCount') || 0;
                if (openLinkCount > 4) {
                  wx.redirectTo({
                    url: '../detail/detail?id=' + postID
                  })
                } else {
                  wx.navigateTo({
                    url: '../detail/detail?id=' + postID
                  })
                  openLinkCount++;
                  wx.setStorageSync('openLinkCount', openLinkCount);
                }
              } else {
                var minAppType = config.getMinAppType;
                var url = '../webpage/webpage'
                if (minAppType == "0") {
                  url = '../webpage/webpage';
                  wx.navigateTo({
                    url: url + '?url=' + href
                  })
                } else {
                  self.copyLink(href);
                }


              }

            }

          }).catch(res => {
            console.log(response.data.message);
          })
      }
    }

  },
  //获取评论
  fetchCommentData: function() {
    var self = this;
    let args = {};
    args.postId = self.data.postID;
    args.limit = pageCount;
    args.page = self.data.page;
    self.setData({
      isLoading: true
    })
    var getCommentsRequest = wxRequest.getRequest(Api.getCommentsReplay(args));
    getCommentsRequest
      .then(response => {
        if (response.statusCode == 200) {
          if (response.data.data.length < pageCount) {
            self.setData({
              isLastPage: true
            });
          }
          if (response.data) {
            self.setData({
              commentsList: [].concat(self.data.commentsList, response.data.data)
            });
            // console.log(self.data.commentsList.length);
            // var newData=self.data.commentsList;
            // for(var i=0;i<=self.data.commentsList.length;i++){
            //   var rancolor = Math.round(Math.random() * 5);
            //   console.log(rancolor);
            //   var newData = self.data.commentsList[i];
            //   console.log(newData)
            //   newData.push({'ranColor':self.data.customColor[rancolor]});
            //   console.log(customColor[2]);
            //   self.setData({
            //     commentsList:newData,
            //   })
            // }

          }

        }

      })
      .catch(response => {
        console.log(response.data.message);

      }).finally(function() {

        self.setData({
          isLoading: false
        });

      });
  },
  //显示或隐藏功能菜单
  ShowHideMenu: function() {
    this.setData({
      isShow: !this.data.isShow,
      isLoad: false,
      menuBackgroup: !this.data.false

    })
  },
  shareShowHide: function() {
    this.setData({
      sharehideshow: !this.data.sharehideshow
    })
  },
  replyHideShow: function() {
    var self = this;
    self.setData({
      replyhideshow: !self.data.replyhideshow
    })

  },
  cancelreply: function(e) {
    var self = this;
    // const text = e.detail.value.trim();
    //   if (text === '') {
    self.setData({
      parentID: "0",
      placeholder: "请说出你的看法...",
      userid: "",
      toFromId: "",
      commentdate: "",
    });
    // }

    self.replyHideShow();
  },
  //点击非评论区隐藏功能菜单
  hiddenMenubox: function() {
    this.setData({
      isShow: false,
      menuBackgroup: false
    })
  },
  //底部刷新
  loadMore: function(e) {
    var self = this;
    if (!self.data.isLastPage) {
      self.setData({
        page: self.data.page + 1
      });
      console.log('当前页' + self.data.page);
      this.fetchCommentData();
    } else {
      wx.showToast({
        title: '没有更多内容',
        mask: false,
        duration: 1000
      });
    }
  },
  replay: function(e) {
    var self = this;
    var id = e.target.dataset.id;
    var name = e.target.dataset.name;
    var userid = e.target.dataset.userid;
    var toFromId = e.target.dataset.formid;
    var commentdate = e.target.dataset.commentdate;
    isFocusing = true;
    if (self.data.enableComment == "1") {

      self.setData({
        parentID: id,
        placeholder: "回复" + name + ":",
        focus: false,
        userid: userid,
        toFromId: toFromId,
        commentdate: commentdate,
      });

    }
    console.log('toFromId', toFromId);
    console.log('replay', isFocusing);
    //  self.onRepleyFocus();
    self.replyHideShow(); //是否显示回复框-底部模态
  },
  onReplyBlur: function(e) {
    var self = this;
    console.log('onReplyBlur', isFocusing);
    isFocusing = false;
    if (!isFocusing) {
      {
        const text = e.detail.value.trim();
        if (text === '') {
          self.setData({
            parentID: "0",
            placeholder: "请说出你的看法...",
            userid: "",
            toFromId: "",
            commentdate: "",
          });
        }
      }
      // self.replyHideShow();
    }
    console.log(isFocusing);
  },
  onRepleyFocus: function(e) {
    var self = this;
    isFocusing = true;
    console.log('onRepleyFocus', isFocusing);
    if (!self.data.focus) {
      self.setData({
        focus: true
      })
    }


  },

  //可以考虑新思路，回复的时候不让文本框获得焦点，失去焦点的时候不消除回复数据，回复模态窗消失时候再清除回复数据  

  //提交评论
  formSubmit: function(e) {
    var self = this;
    var comment = e.detail.value.inputComment;
    var parent = self.data.parentID;
    var postID = e.detail.value.inputPostID;
    var formId = e.detail.formId;
    if (formId == "the formId is a mock one") {
      formId = "";

    }
    var userid = self.data.userid;
    var toFromId = self.data.toFromId;
    var commentdate = self.data.commentdate;
    if (comment.length === 0) {
      self.setData({
        'dialog.hidden': false,
        'dialog.title': '提示',
        'dialog.content': '没有填写评论内容。'

      });
    } else {
      if (self.data.openid) {
        var name = self.data.userInfo.nickName;
        var author_url = self.data.userInfo.avatarUrl;
        var email = self.data.openid + "@qq.com";
        var openid = self.data.openid;
        var fromUser = self.data.userInfo.nickName;
        var data = {
          post: postID,
          author_name: name,
          author_email: email,
          content: comment,
          author_url: author_url,
          parent: parent,
          openid: openid,
          userid: userid,
          formId: formId
        };
        var url = Api.postWeixinComment();
        var postCommentRequest = wxRequest.postRequest(url, data);
        postCommentRequest
          .then(res => {
            if (res.statusCode == 200) {
              if (res.data.status == '200') {
                self.setData({
                  content: '',
                  parentID: "0",
                  userid: 0,
                  placeholder: "请说出你的看法...",
                  focus: false,
                  commentsList: []

                });
                console.log(res.data.message);
                if (parent != "0" && !util.getDateOut(commentdate) && toFromId != "") {
                  var useropenid = res.data.useropenid;
                  var data = {
                    openid: useropenid,
                    postid: postID,
                    template_id: self.data.replayTemplateId,
                    form_id: toFromId,
                    total_fee: comment,
                    fromUser: fromUser,
                    flag: 3,
                    parent: parent
                  };

                  url = Api.sendMessagesUrl();
                  var sendMessageRequest = wxRequest.postRequest(url, data);
                  sendMessageRequest.then(response => {
                    if (response.data.status == '200') {
                      console.log(response.data.message);
                      // wx.navigateBack({
                      //     delta: 1
                      // })

                    } else {
                      console.log(response.data.message);

                    }

                  });

                }
                console.log(res.data.code);
                var commentCounts = parseInt(self.data.total_comments) + 1;
                self.setData({
                  total_comments: commentCounts,
                  commentCount: "有" + commentCounts + "条评论"

                });
              } else if (res.data.status == '500') {
                self.setData({
                  'dialog.hidden': false,
                  'dialog.title': '提示',
                  'dialog.content': '评论失败，请稍后重试。'

                });
              }
            } else {

              if (res.data.code == 'rest_comment_login_required') {
                self.setData({
                  'dialog.hidden': false,
                  'dialog.title': '提示',
                  'dialog.content': '管理员未开通匿名评论功能！'

                });
              } else if (res.data.code == 'rest_invalid_param' && res.data.message.indexOf('author_email') > 0) {
                self.setData({
                  'dialog.hidden': false,
                  'dialog.title': '提示',
                  'dialog.content': 'email填写错误！'

                });
              } else {
                console.log(res.data.code)
                self.setData({
                  'dialog.hidden': false,
                  'dialog.title': '提示',
                  'dialog.content': '评论失败,' + res.data.message

                });
              }
            }
          }).then(response => {
            //self.fetchCommentData(self.data); 
            self.setData({
              page: 1,
              commentsList: [],
              isLastPage: false

            })
            self.onReachBottom();
            //self.fetchCommentData();
            setTimeout(function() {
              wx.showToast({
                title: '评论发布成功',
                icon: 'success',
                duration: 900,
                success: function() {}
              })
            }, 900);
            self.replyHideShow();
          }).catch(response => {
            console.log(response)
            self.setData({
              'dialog.hidden': false,
              'dialog.title': '提示',
              'dialog.content': '评论失败,' + response

            });
          })
      } else {
        Auth.checkSession(self, 'isLoginNow');

      }

    }

  },
  agreeGetUser: function(e) {
    let self = this;
    Auth.checkAgreeGetUser(e, app, self, '0');;

  },
  closeLoginPopup() {
    this.setData({
      isLoginPopup: false
    });
  },
  openLoginPopup() {
    this.setData({
      isLoginPopup: true
    });
  },
  confirm: function() {
    this.setData({
      'dialog.hidden': true,
      'dialog.title': '',
      'dialog.content': ''
    })
  },

  //评论生成海报
  pinglunhaibao: function(e) {
    var self = this;
    var index = e.target.dataset.index;
    self.setData({
      pinglunhaibaoindex: index,
      sharetype: 'comments'
    });
    if (self.data.openid) {
      self.downimageTolocal();
    } else {
      setTimeout(function() {
        wx.showToast({
          title: '请先授权后，再生成海报',
          icon: 'none',
          duration: 1500,
          success: function() {}
        })
      }, 1200);
      Auth.checkSession(self, 'isLoginNow');     
    }
  },
  putongshare: function() {
    var self = this;
    self.setData({
      pinglunhaibaoindex: 99999,
      sharetype: 'bottom'
    });
    if (self.data.openid) {
      self.downimageTolocal();
    } else {
      setTimeout(function () {
        wx.showToast({
          title: '请先授权后，再生成海报',
          icon: 'none',
          duration: 1500,
          success: function () { }
        })
      }, 1200);
      Auth.checkSession(self, 'isLoginNow');
      self.shareShowHide();
    }
  },

  //下载图片并生成海报
  downimageTolocal: function() {
    var self = this;
    // self.ShowHideMenu();
    if (self.data.sharehideshow) {
      self.shareShowHide();
    }

    // wx.showLoading({
    //     title: "正在生成海报",
    //     mask: true,
    // });
    var postid = self.data.detail.id;
    var title = self.data.detail.title.rendered;
    var path = "pages/detail/detail?id=" + postid;
    var excerpt = util.removeHTML(self.data.detail.excerpt.rendered);
    var postImageUrl = "";
    var posterImagePath = "";
    var qrcodeImagePath = "";
    var avatarImagePath = "";
    var flag = false;
    var imageInlocalFlag = false;
    var domain = config.getDomain;
    var downloadFileDomain = config.getDownloadFileDomain;

    var fristImage = self.data.detail.post_medium_image;
    if (self.data.sharetype == 'comments') {
      excerpt = util.removeHTML(self.data.commentsList[self.data.pinglunhaibaoindex].content);
      console.log('海报文字：', excerpt)
    }

    //获取文章首图临时地址，若没有就用默认的图片,如果图片不是request域名，使用本地图片
    if (fristImage) {
      var n = 0;
      for (var i = 0; i < downloadFileDomain.length; i++) {

        if (fristImage.indexOf(downloadFileDomain[i].domain) != -1) {
          n++;
          break;
        }
      }
      if (n > 0) {
        imageInlocalFlag = false;
        postImageUrl = fristImage;

      } else {
        postImageUrl = config.getPostImageUrl;
        posterImagePath = postImageUrl;
        imageInlocalFlag = true;
      }

    } else {
      postImageUrl = config.getPostImageUrl;
      posterImagePath = postImageUrl;
      imageInlocalFlag = true;
    }

    console.log(postImageUrl);
    var data = {
      postid: postid,
      path: path

    };
    var url = Api.creatPoster();
    var qrcodeUrl = "";
    var posterQrcodeUrl = Api.getPosterQrcodeUrl() + "qrcode-" + postid + ".png";
    //生成二维码
    var creatPosterRequest = wxRequest.postRequest(url, data);
    creatPosterRequest.then(response => {
      if (response.statusCode == 200) {
        if (response.data.status == '200') {
          const downloadTaskQrcodeImage = wx.downloadFile({
            url: posterQrcodeUrl,
            success: res => {
              if (res.statusCode === 200) {
                qrcodeImagePath = res.tempFilePath;
                console.log("二维码图片本地位置：" + res.tempFilePath);
                if (!imageInlocalFlag) {
                  const downloadTaskForPostImage = wx.downloadFile({
                    url: postImageUrl,
                    success: res => {
                      if (res.statusCode === 200) {
                        posterImagePath = res.tempFilePath;
                        console.log("文章图片本地位置：" + res.tempFilePath);

                        //获取头像
                        if (self.data.userInfo.avatarUrl) {
                          const downloadTaskForAvatarImage = wx.downloadFile({
                            url: self.data.userInfo.avatarUrl,
                            success: res => {
                              if (res.statusCode === 200) {
                                avatarImagePath = res.tempFilePath;
                                console.log("头像图片本地位置：" + res.tempFilePath);
                                flag = true;
                                if (posterImagePath && qrcodeImagePath && avatarImagePath) {
                                  self.createPosterLocal(posterImagePath, qrcodeImagePath, title, excerpt, avatarImagePath);
                                }

                              } else {
                                console.log(res);
                                wx.hideLoading();
                                wx.showToast({
                                  title: "头像获取失败...",
                                  mask: true,
                                  duration: 2000
                                });
                              }
                            }
                          });
                          downloadTaskForAvatarImage.onProgressUpdate((res) => {
                            console.log('下载头像图片进度：' + res.progress)

                          })
                        } else {
                          avatarImagePath = "../../images/gravatar.png"
                        }
                        //全部下载成功
                        if (posterImagePath && qrcodeImagePath) {
                          self.createPosterLocal(posterImagePath, qrcodeImagePath, title, excerpt, avatarImagePath);
                        }
                      } else {
                        console.log(res);
                        wx.hideLoading();
                        wx.showToast({
                          title: "生成海报失败...",
                          mask: true,
                          duration: 2000
                        });
                        return false;

                      }
                    }
                  });
                  downloadTaskForPostImage.onProgressUpdate((res) => {
                    console.log('下载文章图片进度：' + res.progress)

                  })
                } else {
                  if (posterImagePath && qrcodeImagePath) {
                    self.createPosterLocal(posterImagePath, qrcodeImagePath, title, excerpt, avatarImagePath);
                  }
                }
              } else {
                console.log(res);
                //wx.hideLoading();
                flag = false;
                wx.showToast({
                  title: "生成海报失败...",
                  mask: true,
                  duration: 2000
                });
                return false;
              }
            }
          });
          downloadTaskQrcodeImage.onProgressUpdate((res) => {
            console.log('下载二维码进度', res.progress)
          })
        } else {
          console.log(response);
          //wx.hideLoading();
          flag = false;
          wx.showToast({
            title: "生成海报失败...",
            mask: true,
            duration: 2000
          });
          return false;
        }
      } else {
        console.log(response);
        //wx.hideLoading();
        flag = false;
        wx.showToast({
          title: "生成海报失败...",
          mask: true,
          duration: 2000
        });
        return false;
      }

    });


  },

  //将canvas转换为图片保存到本地，然后将路径传给image图片的src
  createPosterLocal: function(postImageLocal, qrcodeLoal, title, excerpt, avatarImageLocal) {
    var that = this;
    wx.showLoading({
      title: "正在生成海报",
      mask: true,
    });
    var context = wx.createCanvasContext('mycanvas');
    context.setFillStyle('#ffffff'); //填充背景色
    context.fillRect(0, 0, 600, 970);
    context.drawImage(postImageLocal, 0, 0, 600, 448); //绘制首图
    context.drawImage('../../images/postertemp.png', 0, 0, 600, 970);
    context.drawImage(qrcodeLoal, 450, 825, 100, 100); //绘制二维码
    //画圆形头像
    context.setFillStyle('#f0f0f0')
    context.arc(44, 49, 26, 0, 2 * Math.PI)
    context.fill()
    util.circleImg(context, avatarImageLocal, 20, 25, 24);
    //context.drawImage(avatarImageLocal, 20, 25, 48, 48); 


    // context.draw()
    //const grd = context.createLinearGradient(30, 690, 570, 690)//定义一个线性渐变的颜色
    //grd.addColorStop(0, 'black')
    //grd.addColorStop(1, '#118fff')
    //context.setFillStyle(grd)
    //显示分享者名字
    context.setFillStyle("#9f9f9f");
    context.setFontSize(20);
    context.setTextAlign('left');
    context.fillText(that.data.userInfo.nickName, 74, 59);
    context.setFillStyle("#ffffff");
    context.setFontSize(20);
    context.setTextAlign('left');
    context.fillText(that.data.userInfo.nickName, 75, 60);
    if (that.data.sharetype == 'comments') {
      context.setFillStyle("#959595");
      context.setFontSize(20);
      context.setTextAlign('right');
      context.fillText('——' + that.data.commentsList[that.data.pinglunhaibaoindex].author_name + '论述于' + that.data.commentsList[that.data.pinglunhaibaoindex].date, 540, 700);
    }
    //显示二维码提示文字
    // context.setFillStyle("#959595");
    // context.setFontSize(20);
    // context.setTextAlign('center');
    // context.fillText("阅读文章，请长按识别二维码", 300, 900);
    //context.setStrokeStyle(grd)
    context.setFillStyle("#959595");
    // context.beginPath()//分割线
    // context.moveTo(30, 690)
    // context.lineTo(570, 690)
    // context.stroke();
    //this.setUserInfo(context);//用户信息        
    util.drawTitleExcerpt(context, title, excerpt); //文章标题
    context.draw();
    //将生成好的图片保存到本地，需要延迟一会，绘制期间耗时
    setTimeout(function() {
      wx.canvasToTempFilePath({
        canvasId: 'mycanvas',
        success: function(res) {
          var tempFilePath = res.tempFilePath;
          // that.setData({
          //     imagePath: tempFilePath,
          //     maskHidden: "none"
          // });
          wx.hideLoading();
          console.log("海报图片路径：" + res.tempFilePath);
          that.modalView.showModal({
            title: '保存至相册',
            confirmation: false,
            confirmationText: '',
            inputFields: [{
              fieldName: 'posterImage',
              fieldType: 'Image',
              fieldPlaceHolder: '',
              fieldDatasource: res.tempFilePath,
              isRequired: false,
            }],
            confirm: function(res) {
              console.log(res)
              //用户按确定按钮以后会回到这里，并且对输入的表单数据会带回
            }
          })


        },
        fail: function(res) {
          console.log(res);
        }
      });
    }, 900);
  }

})
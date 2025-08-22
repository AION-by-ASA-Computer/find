<template lang="pug">
  v-app(v-scroll='upBtnScroll', :dark='$vuetify.theme.dark', :class='$vuetify.rtl ? `is-rtl` : `is-ltr`')
    nav-header(v-if='!printView')
    v-navigation-drawer(
      v-if='navMode !== `NONE` && !printView'
      :class='$vuetify.theme.dark ? `grey darken-4-d4` : `primary`'
      dark
      app
      clipped
      mobile-breakpoint='600'
      :temporary='$vuetify.breakpoint.smAndDown'
      v-model='navShown'
      :right='$vuetify.rtl'
      )
      vue-scroll(:ops='scrollStyle')
        nav-sidebar(:color='$vuetify.theme.dark ? `grey darken-4-d4` : `primary`', :items='sidebarDecoded', :nav-mode='navMode')

    v-fab-transition(v-if='navMode !== `NONE`')
      v-btn(
        fab
        color='primary'
        fixed
        bottom
        :right='$vuetify.rtl'
        :left='!$vuetify.rtl'
        small
        @click='navShown = !navShown'
        v-if='$vuetify.breakpoint.mdAndDown'
        v-show='!navShown'
        )
        v-icon mdi-menu

    v-main(ref='content')
      template(v-if='path !== `home`')
        v-toolbar(:color='$vuetify.theme.dark ? `grey darken-4-d3` : `grey lighten-3`', flat, dense, v-if='$vuetify.breakpoint.smAndUp')
          //- v-btn.pl-0(v-if='$vuetify.breakpoint.xsOnly', flat, @click='toggleNavigation')
          //-   v-icon(color='grey darken-2', left) menu
          //-   span Navigation
          v-breadcrumbs.breadcrumbs-nav.pl-0(
            :items='breadcrumbs'
            divider='/'
            )
            template(slot='item', slot-scope='props')
              v-icon(v-if='props.item.path === "/"', small, @click='goHome') mdi-home
              v-btn.ma-0(v-else, :href='props.item.path', small, text) {{props.item.name}}
          template(v-if='!isPublished')
            v-spacer
            .caption.red--text {{$t('common:page.unpublished')}}
            status-indicator.ml-3(negative, pulse)
        v-divider
      v-container.grey.pa-0(fluid, :class='$vuetify.theme.dark ? `darken-4-l3` : `lighten-4`')
        v-row.page-header-section(no-gutters, align-content='center', style='height: 90px;')
          v-col.page-col-content.is-page-header(
            :offset-xl='tocPosition === `left` ? 2 : 0'
            :offset-lg='tocPosition === `left` ? 3 : 0'
            :xl='tocPosition === `right` ? 10 : false'
            :lg='tocPosition === `right` ? 9 : false'
            style='margin-top: auto; margin-bottom: auto;'
            :class='$vuetify.rtl ? `pr-4` : `pl-4`'
            )
            .page-header-headings
              .headline.grey--text(:class='$vuetify.theme.dark ? `text--lighten-2` : `text--darken-3`') {{title}}
              .caption.grey--text.text--darken-1 {{description}}
            .page-edit-shortcuts(
              v-if='editShortcutsObj.editMenuBar'
              :class='tocPosition === `right` ? `is-right` : ``'
              )
              v-btn(
                v-if='editShortcutsObj.editMenuBtn'
                @click='pageEdit'
                depressed
                small
                )
                v-icon.mr-2(small) mdi-pencil
                span.text-none {{$t(`common:actions.edit`)}}
              v-btn(
                v-if='editShortcutsObj.editMenuExternalBtn'
                :href='editMenuExternalUrl'
                target='_blank'
                depressed
                small
                )
                v-icon.mr-2(small) {{ editShortcutsObj.editMenuExternalIcon }}
                span.text-none {{$t(`common:page.editExternal`, { name: editShortcutsObj.editMenuExternalName })}}
      v-divider
      v-container.pl-5.pt-4(fluid, grid-list-xl)
        v-layout(row)
          v-flex.page-col-sd(
            v-if='tocPosition !== `off` && $vuetify.breakpoint.lgAndUp'
            :order-xs1='tocPosition !== `right`'
            :order-xs2='tocPosition === `right`'
            lg3
            xl2
            )
            v-card.page-toc-card.mb-5(v-if='tocDecoded.length')
              .overline.pa-5.pb-0(:class='$vuetify.theme.dark ? `blue--text text--lighten-2` : `primary--text`') {{$t('common:page.toc')}}
              v-list.pb-3(dense, nav, :class='$vuetify.theme.dark ? `darken-3-d3` : ``')
                template(v-for='(tocItem, tocIdx) in tocDecoded')
                  v-list-item(@click='$vuetify.goTo(tocItem.anchor, scrollOpts)')
                    v-icon(color='grey', small) {{ $vuetify.rtl ? `mdi-chevron-left` : `mdi-chevron-right` }}
                    v-list-item-title.px-3 {{tocItem.title}}
                  //- v-divider(v-if='tocIdx < toc.length - 1 || tocItem.children.length')
                  template(v-for='tocSubItem in tocItem.children')
                    v-list-item(@click='$vuetify.goTo(tocSubItem.anchor, scrollOpts)')
                      v-icon.px-3(color='grey lighten-1', small) {{ $vuetify.rtl ? `mdi-chevron-left` : `mdi-chevron-right` }}
                      v-list-item-title.px-3.caption.grey--text(:class='$vuetify.theme.dark ? `text--lighten-1` : `text--darken-1`') {{tocSubItem.title}}
                    //- v-divider(inset, v-if='tocIdx < toc.length - 1')

            v-card.page-tags-card.mb-5(v-if='tags.length > 0')
              .pa-5
                .overline.teal--text.pb-2(:class='$vuetify.theme.dark ? `text--lighten-3` : ``') {{$t('common:page.tags')}}
                v-chip.mr-1.mb-1(
                  label
                  :color='$vuetify.theme.dark ? `teal darken-1` : `teal lighten-5`'
                  v-for='(tag, idx) in tags'
                  :href='`/t/` + tag.tag'
                  :key='`tag-` + tag.tag'
                  )
                  v-icon(:color='$vuetify.theme.dark ? `teal lighten-3` : `teal`', left, small) mdi-tag
                  span(:class='$vuetify.theme.dark ? `teal--text text--lighten-5` : `teal--text text--darken-2`') {{tag.title}}
                v-chip.mr-1.mb-1(
                  label
                  :color='$vuetify.theme.dark ? `teal darken-1` : `teal lighten-5`'
                  :href='`/t/` + tags.map(t => t.tag).join(`/`)'
                  :aria-label='$t(`common:page.tagsMatching`)'
                  )
                  v-icon(:color='$vuetify.theme.dark ? `teal lighten-3` : `teal`', size='20') mdi-tag-multiple

            v-card.page-comments-card.mb-5(v-if='commentsEnabled && commentsPerms.read')
              .pa-5
                .overline.pb-2.blue-grey--text.d-flex.align-center(:class='$vuetify.theme.dark ? `text--lighten-3` : `text--darken-2`')
                  span {{$t('common:comments.sdTitle')}}
                  //- v-spacer
                  //- v-chip.text-center(
                  //-   v-if='!commentsExternal'
                  //-   label
                  //-   x-small
                  //-   :color='$vuetify.theme.dark ? `blue-grey darken-3` : `blue-grey darken-2`'
                  //-   dark
                  //-   style='min-width: 50px; justify-content: center;'
                  //-   )
                  //-   span {{commentsCount}}
                .d-flex
                  v-btn.text-none(
                    @click='goToComments()'
                    :color='$vuetify.theme.dark ? `blue-grey` : `blue-grey darken-2`'
                    outlined
                    style='flex: 1 1 100%;'
                    small
                    )
                    span.blue-grey--text(:class='$vuetify.theme.dark ? `text--lighten-1` : `text--darken-2`') {{$t('common:comments.viewDiscussion')}}
                  v-tooltip(right, v-if='commentsPerms.write')
                    template(v-slot:activator='{ on }')
                      v-btn.ml-2(
                        @click='goToComments(true)'
                        v-on='on'
                        outlined
                        small
                        :color='$vuetify.theme.dark ? `blue-grey` : `blue-grey darken-2`'
                        :aria-label='$t(`common:comments.newComment`)'
                        )
                        v-icon(:color='$vuetify.theme.dark ? `blue-grey lighten-1` : `blue-grey darken-2`', dense) mdi-comment-plus
                    span {{$t('common:comments.newComment')}}

            v-card.page-author-card.mb-5
              .pa-5
                .overline.indigo--text.d-flex(:class='$vuetify.theme.dark ? `text--lighten-3` : ``')
                  span {{$t('common:page.lastEditedBy')}}
                  v-spacer
                  v-tooltip(right, v-if='isAuthenticated')
                    template(v-slot:activator='{ on }')
                      v-btn.btn-animate-edit(
                        icon
                        :href='"/h/" + locale + "/" + path'
                        v-on='on'
                        x-small
                        v-if='hasReadHistoryPermission'
                        :aria-label='$t(`common:header.history`)'
                        )
                        v-icon(color='indigo', dense) mdi-history
                    span {{$t('common:header.history')}}
                .page-author-card-name.body-2.grey--text(:class='$vuetify.theme.dark ? `` : `text--darken-3`') {{ authorName }}
                .page-author-card-date.caption.grey--text.text--darken-1 {{ updatedAt | moment('calendar') }}

            //- v-card.mb-5
            //-   .pa-5
            //-     .overline.pb-2.yellow--text(:class='$vuetify.theme.dark ? `text--darken-3` : `text--darken-4`') Rating
            //-     .text-center
            //-       v-rating(
            //-         v-model='rating'
            //-         color='yellow darken-3'
            //-         background-color='grey lighten-1'
            //-         half-increments
            //-         hover
            //-       )
            //-       .caption.grey--text 5 votes

            v-card.page-shortcuts-card(flat)
              v-toolbar(:color='$vuetify.theme.dark ? `grey darken-4-d3` : `grey lighten-3`', flat, dense)
                v-spacer
                //- v-tooltip(bottom)
                //-   template(v-slot:activator='{ on }')
                //-     v-btn(icon, tile, v-on='on', :aria-label='$t(`common:page.bookmark`)'): v-icon(color='grey') mdi-bookmark
                //-   span {{$t('common:page.bookmark')}}
                v-menu(offset-y, bottom, min-width='300')
                  template(v-slot:activator='{ on: menu }')
                    v-tooltip(bottom)
                      template(v-slot:activator='{ on: tooltip }')
                        v-btn(icon, tile, v-on='{ ...menu, ...tooltip }', :aria-label='$t(`common:page.share`)'): v-icon(color='grey') mdi-share-variant
                      span {{$t('common:page.share')}}
                  social-sharing(
                    :url='pageUrl'
                    :title='title'
                    :description='description'
                  )
                v-tooltip(bottom)
                  template(v-slot:activator='{ on }')
                    v-btn(icon, tile, v-on='on', @click='print', :aria-label='$t(`common:page.printFormat`)')
                      v-icon(:color='printView ? `primary` : `grey`') mdi-printer
                  span {{$t('common:page.printFormat')}}
                v-spacer

          v-flex.page-col-content(
            xs12
            :lg9='tocPosition !== `off`'
            :xl10='tocPosition !== `off`'
            :order-xs1='tocPosition === `right`'
            :order-xs2='tocPosition !== `right`'
            )
            v-tooltip(:right='$vuetify.rtl', :left='!$vuetify.rtl', v-if='hasAnyPagePermissions && editShortcutsObj.editFab')
              template(v-slot:activator='{ on: onEditActivator }')
                v-speed-dial(
                  v-model='pageEditFab'
                  direction='top'
                  open-on-hover
                  transition='scale-transition'
                  bottom
                  :right='!$vuetify.rtl'
                  :left='$vuetify.rtl'
                  fixed
                  dark
                  )
                  template(v-slot:activator)
                    v-btn.btn-animate-edit(
                      fab
                      color='primary'
                      v-model='pageEditFab'
                      @click='pageEdit'
                      v-on='onEditActivator'
                      :disabled='!hasWritePagesPermission'
                      :aria-label='$t(`common:page.editPage`)'
                      )
                      v-icon mdi-pencil
                  v-tooltip(:right='$vuetify.rtl', :left='!$vuetify.rtl', v-if='hasReadHistoryPermission')
                    template(v-slot:activator='{ on }')
                      v-btn(
                        fab
                        small
                        color='white'
                        light
                        v-on='on'
                        @click='pageHistory'
                        )
                        v-icon(size='20') mdi-history
                    span {{$t('common:header.history')}}
                  v-tooltip(:right='$vuetify.rtl', :left='!$vuetify.rtl', v-if='hasReadSourcePermission')
                    template(v-slot:activator='{ on }')
                      v-btn(
                        fab
                        small
                        color='white'
                        light
                        v-on='on'
                        @click='pageSource'
                        )
                        v-icon(size='20') mdi-code-tags
                    span {{$t('common:header.viewSource')}}
                  v-tooltip(:right='$vuetify.rtl', :left='!$vuetify.rtl', v-if='hasWritePagesPermission')
                    template(v-slot:activator='{ on }')
                      v-btn(
                        fab
                        small
                        color='white'
                        light
                        v-on='on'
                        @click='pageConvert'
                        )
                        v-icon(size='20') mdi-lightning-bolt
                    span {{$t('common:header.convert')}}
                  v-tooltip(:right='$vuetify.rtl', :left='!$vuetify.rtl', v-if='hasWritePagesPermission')
                    template(v-slot:activator='{ on }')
                      v-btn(
                        fab
                        small
                        color='white'
                        light
                        v-on='on'
                        @click='pageDuplicate'
                        )
                        v-icon(size='20') mdi-content-duplicate
                    span {{$t('common:header.duplicate')}}
                  v-tooltip(:right='$vuetify.rtl', :left='!$vuetify.rtl', v-if='hasManagePagesPermission')
                    template(v-slot:activator='{ on }')
                      v-btn(
                        fab
                        small
                        color='white'
                        light
                        v-on='on'
                        @click='pageMove'
                        )
                        v-icon(size='20') mdi-content-save-move-outline
                    span {{$t('common:header.move')}}
                  v-tooltip(:right='$vuetify.rtl', :left='!$vuetify.rtl', v-if='hasDeletePagesPermission')
                    template(v-slot:activator='{ on }')
                      v-btn(
                        fab
                        dark
                        small
                        color='red'
                        v-on='on'
                        @click='pageDelete'
                        )
                        v-icon(size='20') mdi-trash-can-outline
                    span {{$t('common:header.delete')}}
              span {{$t('common:page.editPage')}}
            v-alert.mb-5(v-if='!isPublished', color='red', outlined, icon='mdi-minus-circle', dense)
              .caption {{$t('common:page.unpublishedWarning')}}
            .contents(ref='container')
              slot(name='contents')
            .comments-container#discussion(v-if='commentsEnabled && commentsPerms.read && !printView')
              .comments-header
                v-icon.mr-2(dark) mdi-comment-text-outline
                span {{$t('common:comments.title')}}
              .comments-main
                slot(name='comments')
    nav-footer
    notify
    search-results
    v-fab-transition
      v-btn(
        v-if='upBtnShown'
        fab
        fixed
        bottom
        :right='$vuetify.rtl'
        :left='!$vuetify.rtl'
        small
        :depressed='this.$vuetify.breakpoint.mdAndUp'
        @click='$vuetify.goTo(0, scrollOpts)'
        color='primary'
        dark
        :style='upBtnPosition'
        :aria-label='$t(`common:actions.returnToTop`)'
        )
        v-icon mdi-arrow-up
</template>

<script>
import { StatusIndicator } from 'vue-status-indicator'
import Tabset from './tabset.vue'
import NavSidebar from './nav-sidebar.vue'
import Prism from 'prismjs'
import mermaid from 'mermaid'
import { get, sync } from 'vuex-pathify'
import _ from 'lodash'
import ClipboardJS from 'clipboard'
import Vue from 'vue'

Vue.component('Tabset', Tabset)

Prism.plugins.autoloader.languages_path = '/_assets/js/prism/'
Prism.plugins.NormalizeWhitespace.setDefaults({
  'remove-trailing': true,
  'remove-indent': true,
  'left-trim': true,
  'right-trim': true,
  'remove-initial-line-feed': true,
  'tabs-to-spaces': 2
})
Prism.plugins.toolbar.registerButton('copy-to-clipboard', (env) => {
  let linkCopy = document.createElement('button')
  linkCopy.textContent = 'Copy'

  const clip = new ClipboardJS(linkCopy, {
    text: () => { return env.code }
  })

  clip.on('success', () => {
    linkCopy.textContent = 'Copied!'
    resetClipboardText()
  })
  clip.on('error', () => {
    linkCopy.textContent = 'Press Ctrl+C to copy'
    resetClipboardText()
  })

  return linkCopy

  function resetClipboardText() {
    setTimeout(() => {
      linkCopy.textContent = 'Copy'
    }, 5000)
  }
})

export default {
  components: {
    NavSidebar,
    StatusIndicator
  },
  props: {
    pageId: {
      type: Number,
      default: 0
    },
    locale: {
      type: String,
      default: 'en'
    },
    path: {
      type: String,
      default: 'home'
    },
    title: {
      type: String,
      default: 'Untitled Page'
    },
    description: {
      type: String,
      default: ''
    },
    createdAt: {
      type: String,
      default: ''
    },
    updatedAt: {
      type: String,
      default: ''
    },
    tags: {
      type: Array,
      default: () => ([])
    },
    authorName: {
      type: String,
      default: 'Unknown'
    },
    authorId: {
      type: Number,
      default: 0
    },
    editor: {
      type: String,
      default: ''
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    toc: {
      type: String,
      default: ''
    },
    sidebar: {
      type: String,
      default: ''
    },
    navMode: {
      type: String,
      default: 'MIXED'
    },
    commentsEnabled: {
      type: Boolean,
      default: false
    },
    effectivePermissions: {
      type: String,
      default: ''
    },
    commentsExternal: {
      type: Boolean,
      default: false
    },
    editShortcuts: {
      type: String,
      default: ''
    },
    filename: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      navShown: false,
      navExpanded: false,
      upBtnShown: false,
      pageEditFab: false,
      scrollOpts: {
        duration: 1500,
        offset: 0,
        easing: 'easeInOutCubic'
      },
      scrollStyle: {
        vuescroll: {},
        scrollPanel: {
          initialScrollX: 0.01, // fix scrollbar not disappearing on load
          scrollingX: false,
          speed: 50
        },
        rail: {
          gutterOfEnds: '2px'
        },
        bar: {
          onlyShowBarOnScroll: false,
          background: '#42A5F5',
          hoverStyle: {
            background: '#64B5F6'
          }
        }
      },
      winWidth: 0
    }
  },
  computed: {
    isAuthenticated: get('user/authenticated'),
    commentsCount: get('page/commentsCount'),
    commentsPerms: get('page/effectivePermissions@comments'),
    editShortcutsObj: get('page/editShortcuts'),
    rating: {
      get() {
        return 3.5
      },
      set(val) {

      }
    },
    breadcrumbs() {
      return [{ path: '/', name: 'Home' }].concat(_.reduce(this.path.split('/'), (result, value, key) => {
        result.push({
          path: _.get(_.last(result), 'path', `/${this.locale}`) + `/${value}`,
          name: value
        })
        return result
      }, []))
    },
    pageUrl() { return window.location.href },
    upBtnPosition() {
      if (this.$vuetify.breakpoint.mdAndUp) {
        return this.$vuetify.rtl ? `right: 235px;` : `left: 235px;`
      } else {
        return this.$vuetify.rtl ? `right: 65px;` : `left: 65px;`
      }
    },
    sidebarDecoded() {
      return JSON.parse(Buffer.from(this.sidebar, 'base64').toString())
    },
    tocDecoded() {
      return JSON.parse(Buffer.from(this.toc, 'base64').toString())
    },
    tocPosition: get('site/tocPosition'),
    hasAdminPermission: get('page/effectivePermissions@system.manage'),
    hasWritePagesPermission: get('page/effectivePermissions@pages.write'),
    hasManagePagesPermission: get('page/effectivePermissions@pages.manage'),
    hasDeletePagesPermission: get('page/effectivePermissions@pages.delete'),
    hasReadSourcePermission: get('page/effectivePermissions@source.read'),
    hasReadHistoryPermission: get('page/effectivePermissions@history.read'),
    hasAnyPagePermissions() {
      return this.hasAdminPermission || this.hasWritePagesPermission || this.hasManagePagesPermission ||
        this.hasDeletePagesPermission || this.hasReadSourcePermission || this.hasReadHistoryPermission
    },
    printView: sync('site/printView'),
    editMenuExternalUrl() {
      if (this.editShortcutsObj.editMenuBar && this.editShortcutsObj.editMenuExternalBtn) {
        return this.editShortcutsObj.editMenuExternalUrl.replace('{filename}', this.filename)
      } else {
        return ''
      }
    }
  },
  created() {
    this.$store.set('page/authorId', this.authorId)
    this.$store.set('page/authorName', this.authorName)
    this.$store.set('page/createdAt', this.createdAt)
    this.$store.set('page/description', this.description)
    this.$store.set('page/isPublished', this.isPublished)
    this.$store.set('page/id', this.pageId)
    this.$store.set('page/locale', this.locale)
    this.$store.set('page/path', this.path)
    this.$store.set('page/tags', this.tags)
    this.$store.set('page/title', this.title)
    this.$store.set('page/editor', this.editor)
    this.$store.set('page/updatedAt', this.updatedAt)
    if (this.effectivePermissions) {
      this.$store.set('page/effectivePermissions', JSON.parse(Buffer.from(this.effectivePermissions, 'base64').toString()))
    }
    if (this.editShortcuts) {
      this.$store.set('page/editShortcuts', JSON.parse(Buffer.from(this.editShortcuts, 'base64').toString()))
    }

    this.$store.set('page/mode', 'view')
  },
  mounted() {
    console.log('=== PAGE COMPONENT mounted() START ===')

    this.$store.set('page/id', this.pageId)
    this.$store.set('page/authorId', this.authorId)
    this.$store.set('page/createdAt', this.createdAt)
    this.$store.set('page/description', this.description)
    this.$store.set('page/isPublished', this.isPublished)
    this.$store.set('page/publishEndDate', this.publishEndDate)
    this.$store.set('page/publishStartDate', this.publishStartDate)
    this.$store.set('page/tags', this.tags)
    this.$store.set('page/title', this.title)
    this.$store.set('page/updatedAt', this.updatedAt)
    this.$store.set('page/mode', 'view')

    console.log('Store values set successfully')

    // Funzione di test globale per il debugging
    window.handleTestScroll = (offset) => {
      console.log('=== TEST SCROLL FUNCTION CALLED ===')
      console.log('Test offset:', offset)

      const scrollPos = Math.max(0, (offset / 80) * 24 - 100)
      console.log('Calculated scroll position:', scrollPos)

      window.scrollTo({
        top: scrollPos,
        behavior: 'smooth'
      })

      console.log('Scroll executed')
    }

    // Debug hash detection
    console.log('Current URL:', window.location.href)
    console.log('Current hash:', window.location.hash)
    console.log('Document ready state:', document.readyState)

    this.$nextTick(() => {
      console.log('$nextTick executed')
      Prism.highlightAllUnder(this.$refs.container)
      this.navShown = this.$vuetify.breakpoint.mdAndUp && this.navMode !== 'NONE'
      this.handleSideNavVisibility()
      window.addEventListener('resize', this.handleSideNavVisibility)

      console.log('Basic setup complete')
    })

    // HASH DETECTION CON DEBUG ESTESO
    const currentHash = window.location.hash
    console.log('Checking for hash:', currentHash)

    if (currentHash && currentHash.length > 1) {
      console.log('Hash detected:', currentHash)
      console.log('Hash starts with #offset-?', currentHash.startsWith('#offset-'))

      const handleHashWithDelay = () => {
        console.log('handleHashWithDelay called')
        console.log('Document ready state now:', document.readyState)
        console.log('Calling handleHashNavigation...')
        this.handleHashNavigation()
      }

      if (document.readyState === 'complete') {
        console.log('Document already complete, setting timeout')
        setTimeout(handleHashWithDelay, 2000)
      } else {
        console.log('Document not complete, adding load listener')
        window.addEventListener('load', () => {
          console.log('Load event fired')
          setTimeout(handleHashWithDelay, 2000)
        })
      }
    } else {
      console.log('No hash found')
    }

    // Hash change listener per debug
    window.addEventListener('hashchange', () => {
      console.log('Hash changed to:', window.location.hash)
      if (window.location.hash.startsWith('#offset-')) {
        console.log('Offset hash detected in hashchange event')
        this.handleHashNavigation()
      }
    })

    this.$nextTick(() => {
      this.$refs.container.querySelectorAll(`a[href^="#"], a[href^="${window.location.href.replace(window.location.hash, '')}#"]`).forEach(el => {
        el.onclick = ev => {
          console.log('Internal anchor clicked:', ev.currentTarget.hash)
          ev.preventDefault()
          ev.stopPropagation()
          this.handleHashNavigation(decodeURIComponent(ev.currentTarget.hash))
        }
      })

      window.boot.notify('page-ready')
      console.log('Page ready notification sent')
    })

    console.log('=== PAGE COMPONENT mounted() END ===')
  },
  methods: {
    goHome() {
      window.location.assign('/')
    },
    toggleNavigation() {
      this.navOpen = !this.navOpen
    },
    upBtnScroll() {
      const scrollOffset = window.pageYOffset || document.documentElement.scrollTop
      this.upBtnShown = scrollOffset > window.innerHeight * 0.33
    },
    print() {
      if (this.printView) {
        this.printView = false
      } else {
        this.printView = true
        this.$nextTick(() => {
          window.print()
        })
      }
    },
    pageEdit() {
      this.$root.$emit('pageEdit')
    },
    pageHistory() {
      this.$root.$emit('pageHistory')
    },
    pageSource() {
      this.$root.$emit('pageSource')
    },
    pageConvert() {
      this.$root.$emit('pageConvert')
    },
    pageDuplicate() {
      this.$root.$emit('pageDuplicate')
    },
    pageMove() {
      this.$root.$emit('pageMove')
    },
    pageDelete() {
      this.$root.$emit('pageDelete')
    },
    handleSideNavVisibility() {
      if (window.innerWidth === this.winWidth) { return }
      this.winWidth = window.innerWidth
      if (this.$vuetify.breakpoint.mdAndUp) {
        this.navShown = true
      } else {
        this.navShown = false
      }
    },
    goToComments(focusNewComment = false) {
      this.$vuetify.goTo('#discussion', this.scrollOpts)
      if (focusNewComment) {
        document.querySelector('#discussion-new').focus()
      }
    },


    // NUOVO METODO: Validazione offset
    validateOffset(hash) {
      console.log('=== OFFSET VALIDATION START ===')

      try {
        const offsetStr = hash.replace('#offset-', '').split('-')[0]
        const targetOffset = parseInt(offsetStr)

        const container = this.$refs.container
        if (!container) {
          console.warn('No container for validation')
          return false
        }

        // Ottenere il testo completo
        const fullText = container.innerText || container.textContent
        console.log('Full text length:', fullText.length)
        console.log('Target offset:', targetOffset)

        if (targetOffset >= fullText.length) {
          console.warn('Offset exceeds text length')
          return false
        }

        // Estrarre il testo intorno all'offset per vedere se ha senso
        const beforeText = fullText.substring(Math.max(0, targetOffset - 100), targetOffset)
        const atText = fullText.substring(targetOffset, targetOffset + 100)

        console.log('=== OFFSET CONTENT ANALYSIS ===')
        console.log('Text BEFORE offset:')
        console.log('"' + beforeText + '"')
        console.log('Text AT offset:')
        console.log('"' + atText + '"')

        // Verifica se l'offset cade in mezzo a una parola (potrebbe essere impreciso)
        const charAtOffset = fullText.charAt(targetOffset)
        const charBefore = fullText.charAt(targetOffset - 1)

        console.log('Character at offset:', `"${charAtOffset}"`)
        console.log('Character before:', `"${charBefore}"`)

        // Se cade nel mezzo di una parola, potrebbe essere impreciso
        if (charAtOffset.match(/[a-zA-Z]/) && charBefore.match(/[a-zA-Z]/)) {
          console.log('WARNING: Offset falls in the middle of a word')
        }

        return true

      } catch (error) {
        console.error('Error in offset validation:', error)
        return false
      }
    },

    handleHashNavigation(hash = null) {
      console.log('=== handleHashNavigation START ===')
      const targetHash = hash || window.location.hash
      console.log('handleHashNavigation called with hash:', targetHash)

      if (!targetHash || targetHash.length <= 1) {
        console.log('No hash or hash too short, returning')
        return
      }

      if (targetHash.startsWith('#offset-')) {
        console.log('Offset hash detected, calling scrollToOffset')
        this.scrollToOffset(targetHash)
      } else {
        console.log('Normal anchor hash, using vuetify goTo')
        this.$vuetify.goTo(decodeURIComponent(targetHash), this.scrollOpts)
      }
      console.log('=== handleHashNavigation END ===')
    },

    // METODO MIGLIORATO: scrollToOffset con validazione
    scrollToOffset(hash) {
      console.log('=== scrollToOffset START ===')
      console.log('scrollToOffset called with hash:', hash)

      // Prima validiamo l'offset
      const isValid = this.validateOffset(hash)
      if (!isValid) {
        console.warn('Offset validation failed, using fallback')
      }

      try {
        const offsetStr = hash.replace('#offset-', '').split('-')[0]
        const startOffset = parseInt(offsetStr)

        if (isNaN(startOffset) || startOffset < 0) {
          console.warn('Invalid offset:', startOffset)
          return
        }

        const contentContainer = this.$refs.container
        if (!contentContainer) {
          console.warn('No content container found')
          return
        }

        // METODO MIGLIORATO: Trova l'elemento più preciso
        const targetElement = this.findElementByTextOffset(contentContainer, startOffset)

        if (targetElement) {
          console.log('Found precise target element')

          // Calcola la posizione esatta considerando l'offset all'interno dell'elemento
          const elementOffset = this.calculateElementOffset(targetElement, startOffset)

          const elementRect = targetElement.getBoundingClientRect()
          const scrollTop = window.pageYOffset + elementRect.top - 150 + elementOffset

          console.log('Precise scroll position:', scrollTop)

          window.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          })

          setTimeout(() => {
            this.highlightFoundElement(targetElement, startOffset)
          }, 1000)

        } else {
          console.log('Element not found, using text-based calculation')
          this.scrollToOffsetByTextAnalysis(startOffset)
        }

      } catch (error) {
        console.error('Error in scrollToOffset:', error)
        window.scrollTo(0, 0)
      }
    },

    // NUOVO METODO: Calcola offset all'interno dell'elemento
    calculateElementOffset(element, globalOffset) {
      try {
        const container = this.$refs.container
        const fullText = container.innerText || container.textContent
        const elementText = element.innerText || element.textContent

        // Trova dove inizia questo elemento nel testo globale
        const elementStartInGlobal = fullText.indexOf(elementText)

        if (elementStartInGlobal === -1) {
          return 0 // Non trovato, usa inizio elemento
        }

        // Calcola l'offset relativo all'interno dell'elemento
        const relativeOffset = globalOffset - elementStartInGlobal

        console.log('Element text length:', elementText.length)
        console.log('Element starts at global offset:', elementStartInGlobal)
        console.log('Relative offset within element:', relativeOffset)

        // Se l'offset è all'interno dell'elemento, calcola la posizione verticale
        if (relativeOffset >= 0 && relativeOffset < elementText.length) {
          // Stima approssimativa: 60 caratteri per riga, 24px per riga
          const charsPerLine = 60
          const lineHeight = 24
          const linesIntoElement = Math.floor(relativeOffset / charsPerLine)

          return linesIntoElement * lineHeight
        }

        return 0

      } catch (error) {
        console.error('Error calculating element offset:', error)
        return 0
      }
    },

    // NUOVO METODO: Scroll basato su analisi del testo
    scrollToOffsetByTextAnalysis(targetOffset) {
      console.log('Using text analysis for offset:', targetOffset)

      const container = this.$refs.container
      const fullText = container.innerText || container.textContent

      // Metodo più sofisticato: conta paragrafi e righe
      const textLines = fullText.split('\n')
      let currentOffset = 0
      let targetLine = 0

      for (let i = 0; i < textLines.length; i++) {
        const lineLength = textLines[i].length + 1 // +1 per il \n

        if (currentOffset + lineLength > targetOffset) {
          targetLine = i
          break
        }

        currentOffset += lineLength
      }

      console.log('Target line:', targetLine, 'of', textLines.length)

      // Stima la posizione verticale
      const lineHeight = 24
      const scrollPosition = Math.max(0, targetLine * lineHeight - 150)

      console.log('Text analysis scroll position:', scrollPosition)

      window.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      })
    },

    // NUOVO METODO: Trova l'elemento basato sull'offset di testo
    findElementByTextOffset(container, targetOffset) {
      console.log('=== findElementByTextOffset START ===')

      let currentOffset = 0
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null,
        false
      )

      let node
      while (node = walker.nextNode()) {
        const nodeText = node.textContent
        const nodeLength = nodeText.length

        console.log(`Checking node: "${nodeText.substring(0, 50)}..." (length: ${nodeLength}, current offset: ${currentOffset})`)

        if (currentOffset + nodeLength >= targetOffset) {
          console.log('Found target node!')
          const element = node.parentElement
          console.log('Parent element:', element.tagName, element.className)
          return element
        }

        currentOffset += nodeLength
      }

      console.log('Target element not found')
      return null
    },

    // METODO MIGLIORATO: Evidenziazione più precisa
    highlightFoundElement(element, offset) {
      console.log('=== highlightFoundElement START ===')
      console.log('Highlighting element for offset:', offset)

      if (!element) return

      // Evidenziazione migliorata
      const originalStyles = {
        backgroundColor: element.style.backgroundColor,
        padding: element.style.padding,
        borderRadius: element.style.borderRadius,
        boxShadow: element.style.boxShadow,
        transform: element.style.transform
      }

      // Applicare stili di evidenziazione
      element.style.backgroundColor = '#ffeb3b'
      element.style.padding = '8px 12px'
      element.style.borderRadius = '6px'
      element.style.boxShadow = '0 0 0 3px rgba(255, 235, 59, 0.4)'
      element.style.transition = 'all 0.3s ease'

      // Effetto di "pulsazione"
      setTimeout(() => {
        element.style.transform = 'scale(1.02)'
        setTimeout(() => {
          element.style.transform = 'scale(1)'
        }, 200)
      }, 100)

      // Scroll fine per centrare meglio l'elemento
      setTimeout(() => {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        })
      }, 500)

      // Rimuovere evidenziazione dopo 6 secondi
      setTimeout(() => {
        console.log('Removing highlight...')
        Object.keys(originalStyles).forEach(key => {
          element.style[key] = originalStyles[key]
        })
      }, 6000)

      console.log('=== highlightFoundElement END ===')
    }
  }
}
</script>

<style lang="scss">
.breadcrumbs-nav {
  .v-btn {
    min-width: 0;

    &__content {
      text-transform: none;
    }
  }

  .v-breadcrumbs__divider:nth-child(2n) {
    padding: 0 6px;
  }

  .v-breadcrumbs__divider:nth-child(2) {
    padding: 0 6px 0 12px;
  }
}

.page-col-sd {
  margin-top: -90px;
  align-self: flex-start;
  position: sticky;
  top: 64px;
  max-height: calc(100vh - 64px);
  overflow-y: auto;
  -ms-overflow-style: none;
}

.page-col-sd::-webkit-scrollbar {
  display: none;
}

.page-header-section {
  position: relative;

  >.is-page-header {
    position: relative;
  }

  .page-header-headings {
    min-height: 52px;
    display: flex;
    justify-content: center;
    flex-direction: column;
  }

  .page-edit-shortcuts {
    position: absolute;
    bottom: -33px;
    right: 10px;

    .v-btn {
      border-right: 1px solid #DDD !important;
      border-bottom: 1px solid #DDD !important;
      border-radius: 0;
      color: #777;
      background-color: #FFF !important;

      @at-root .theme--dark & {
        background-color: #222 !important;
        border-right-color: #444 !important;
        border-bottom-color: #444 !important;
        color: #CCC;
      }

      .v-icon {
        color: mc('blue', '700');
      }

      &:first-child {
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
      }

      &:last-child {
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;
      }
    }
  }
}


.aion-search-highlight {
  position: relative;
  scroll-margin-top: 100px;
  /* Assicura che l'elemento non sia nascosto dall'header */
}

/* Animazione di evidenziazione */
@keyframes aion-highlight-pulse {
  0% {
    background-color: #ffeb3b;
    box-shadow: 0 0 0 2px rgba(255, 235, 59, 0.6);
  }

  50% {
    background-color: #fff176;
    box-shadow: 0 0 0 4px rgba(255, 235, 59, 0.4);
  }

  100% {
    background-color: #ffeb3b;
    box-shadow: 0 0 0 2px rgba(255, 235, 59, 0.6);
  }
}

/* Classe per animazione di fade-out */
.aion-highlight-fadeout {
  background-color: transparent !important;
  box-shadow: none !important;
  transition: all 1s ease-out !important;
}

/* Miglioramenti per diversi tipi di elementi */
.aion-search-highlight h1,
.aion-search-highlight h2,
.aion-search-highlight h3,
.aion-search-highlight h4,
.aion-search-highlight h5,
.aion-search-highlight h6 {
  scroll-margin-top: 120px;
}

.aion-search-highlight p,
.aion-search-highlight li,
.aion-search-highlight td {
  scroll-margin-top: 80px;
}

/* Assicurarsi che il contenuto sia sempre visibile */
.page-col-content {
  position: relative;
}

/* Dark mode support */
.theme--dark .aion-search-highlight {
  background-color: #f57f17 !important;
  box-shadow: 0 0 0 2px rgba(245, 127, 23, 0.3) !important;
}

@media (prefers-reduced-motion: reduce) {
  .aion-search-highlight {
    transition: none !important;
    animation: none !important;
  }
}
</style>

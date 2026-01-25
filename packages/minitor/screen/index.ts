import type { App, Plugin } from 'vue'
import type { Router, RouteLocationNormalized } from 'vue-router'
import { sendErrorData } from '../core/sender'
import { getBrowserInfo } from '../core/utils'

// ===================== 原有类型定义 =====================
export interface BlankScreenOptions {
  projectName?: string
  buildVersion?: string
  delay?: number
  router?: Router
  loadingSelectors?: string[]
  wrapperElements?: string[]
  gridSize?: number
  blankThreshold?: number
  useObserver?: boolean
  observerTimeout?: number
  getUserId?: () => string | null | undefined
  /** 新增：上报接口地址（可配置） */
  reportUrl?: string
}

interface BlankScreenReportData {
  // 基础字段
  kind: 'stability'
  type: 'blank'
  emptyPoints: number
  totalPoints: number
  screen: string
  viewPoint: string
  timeStamp: number
  selector: string

  // 页面/路由标识
  pagePath: string
  pageName: string
  routeQuery: Record<string, any>
  routeParams: Record<string, any>

  // 用户/场景信息
  userId: string | null
  uuid: string
  isMobile: boolean
  scene: 'firstLoad' | 'routeChange'
  pageLoadTime: number

  // 浏览器/设备信息（由getBrowserInfo补充，无需提前定义）
  projectName: string
  buildVersion: string
}

// ===================== 原有工具函数 =====================
const getDeviceUuid = (): string => {
  let uuid = localStorage.getItem('device_uuid')
  if (!uuid) {
    uuid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem('device_uuid', uuid)
  }
  return uuid
}

const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

const getPageLoadTime = (): number => {
  if (performance && performance.timing) {
    return performance.timing.loadEventEnd - performance.timing.navigationStart
  }
  return Date.now() - (window._routeChangeTime || Date.now())
}

const getSelector = (element: HTMLElement | null): string => {
  if (!element) return ''
  if (element.id) return `#${element.id}`
  if (element.className) {
    const classList = Array.isArray(element.className)
      ? element.className
      : (element.className as string).split(' ')
    return `.${classList.filter(Boolean).join('.')}`
  }
  return element.nodeName.toLowerCase()
}

// ===================== 核心检测逻辑 =====================
const blankScreen = (
  options: BlankScreenOptions = {},
  routeContext?: {
    route: RouteLocationNormalized | null
    scene: 'firstLoad' | 'routeChange'
  }
): void => {
  const {
    delay = 3000,
    loadingSelectors = ['.loading', '.el-loading', '.v-loading', '#loading'],
    wrapperElements = ['html', 'body', '#app'],
    gridSize = 5,
    blankThreshold = 0.8,
    useObserver = false,
    observerTimeout = 5000,
    getUserId = () => null,
    reportUrl = '/minitor/blank', // 默认上报地址统一为独立模块
    projectName,
    buildVersion
  } = options

  if (!projectName || !buildVersion) {
    console.warn('[BlankScreen] 缺少 projectName 或 buildVersion，取消上报')
    return
  }

  const finalRouteContext = routeContext || {
    route: options.router?.currentRoute.value || null,
    scene: window._isFirstLoad ? 'firstLoad' : 'routeChange'
  }

  let emptyPoints = 0
  let totalPoints = 0

  const isLoadingElement = (element: HTMLElement | null): boolean => {
    if (!element) return false
    const elementSelector = getSelector(element)
    return loadingSelectors.some((loadingSel) => {
      const sel =
        loadingSel.startsWith('.') || loadingSel.startsWith('#') ? loadingSel.slice(1) : loadingSel
      return elementSelector.includes(sel)
    })
  }

  const isWrapper = (element: HTMLElement | null): void => {
    const selector = getSelector(element)
    if (wrapperElements.includes(selector)) {
      emptyPoints++
    }
  }

  const checkGridPoints = (): void => {
    emptyPoints = 0
    totalPoints = 0
    const safeGridSize = Math.max(3, gridSize)

    for (let i = 0; i < safeGridSize; i++) {
      for (let j = 0; j < safeGridSize; j++) {
        const x = (window.innerWidth * i) / (safeGridSize - 1)
        const y = (window.innerHeight * j) / (safeGridSize - 1)
        const targetX = x === 0 ? 1 : x
        const targetY = y === 0 ? 1 : y

        try {
          const elements = document.elementsFromPoint(targetX, targetY)
          const topElement = elements[0] as HTMLElement | null

          if (isLoadingElement(topElement)) {
            totalPoints = 0
            emptyPoints = 0
            return
          }

          isWrapper(topElement)
          totalPoints++
        } catch (e) {
          console.warn('白屏检测坐标异常:', e)
          totalPoints++
        }
      }
    }

    if (totalPoints > 0 && emptyPoints / totalPoints >= blankThreshold) {
      const centerElements = document.elementsFromPoint(
        window.innerWidth / 2,
        window.innerHeight / 2
      )
      const centerSelector = getSelector(centerElements[0] as HTMLElement | null)

      // 构造上报数据
      const reportData: BlankScreenReportData = {
        kind: 'stability',
        type: 'blank',
        emptyPoints,
        totalPoints,
        screen: `${window.screen.width}X${window.screen.height}`,
        viewPoint: `${window.innerWidth}X${window.innerHeight}`,
        timeStamp: Date.now(),
        selector: centerSelector,
        pagePath: finalRouteContext.route?.path || window.location.pathname,
        pageName: String(finalRouteContext.route?.name || ''),
        routeQuery: finalRouteContext.route?.query || {},
        routeParams: finalRouteContext.route?.params || {},
        userId: getUserId() || null,
        uuid: getDeviceUuid(),
        isMobile: isMobileDevice(),
        scene: finalRouteContext.scene,
        pageLoadTime: getPageLoadTime(),
        projectName,
        buildVersion
      }

      sendErrorData(reportData, reportUrl)
    }
  }

  const doObserverDetect = (): void => {
    const appElement = document.querySelector('#app') as HTMLElement | null
    if (!appElement) {
      checkGridPoints()
      return
    }

    const observer = new MutationObserver((mutations) => {
      const hasValidContent =
        appElement.children.length > 0 &&
        !appElement.innerHTML.includes('loading') &&
        !Array.from(appElement.children).every((child) =>
          wrapperElements.includes(getSelector(child as HTMLElement))
        )

      if (hasValidContent) {
        observer.disconnect()
        checkGridPoints()
      }
    })

    observer.observe(appElement, {
      childList: true,
      subtree: true,
      characterData: true
    })

    setTimeout(() => {
      observer.disconnect()
      checkGridPoints()
    }, observerTimeout)
  }

  if (useObserver) {
    setTimeout(doObserverDetect, delay)
  } else {
    setTimeout(checkGridPoints, delay)
  }
}

export const BlankScreenPlugin: Plugin = {
  install(app: App, options: BlankScreenOptions = {}) {
    window._isFirstLoad = true

    app.config.globalProperties.$revue = {
      ...(app.config.globalProperties.$revue as Record<string, any>),
      blankScreen: (customOptions?: Partial<BlankScreenOptions>) => {
        blankScreen(
          { ...options, ...customOptions },
          {
            route: options.router?.currentRoute.value || null,
            scene: window._isFirstLoad ? 'firstLoad' : 'routeChange'
          }
        )
      }
    }

    if (options.router) {
      options.router.afterEach((to) => {
        window._routeChangeTime = Date.now()
        window._isFirstLoad = false
        blankScreen(options, {
          route: to,
          scene: 'routeChange'
        })
      })

      window.addEventListener('load', () => {
        blankScreen(options, {
          route: options.router?.currentRoute.value || null,
          scene: 'firstLoad'
        })
        window._isFirstLoad = false
      })
    }
  }
}

// ===================== 类型扩展 =====================
declare global {
  interface Window {
    _isFirstLoad: boolean
    _routeChangeTime: number
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $revue: {
      blankScreen: (options?: Partial<BlankScreenOptions>) => void
    }
  }
}

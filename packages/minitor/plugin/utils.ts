import { execSync } from 'child_process'

const getGitBranch = () => {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim().replace(/\//g, '-')
  } catch (e) {
    return 'unknown-branch'
  }
}

const getGitCommitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch (e) {
    return 'unknown-hash'
  }
}

const getDate = () => {
  const date = new Date()
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('')
}

const getTime = () => {
  const date = new Date()
  return String(date.getHours()).padStart(2, '0') + String(date.getMinutes()).padStart(2, '0')
}

export const buildVersion = `${getGitBranch()}_${getGitCommitHash()}_${getDate()}_${getTime()}`

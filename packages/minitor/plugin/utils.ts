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

export const buildVersion = `${getGitBranch()}_${getGitCommitHash()}`

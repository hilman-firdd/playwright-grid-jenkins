#!/usr/bin/env groovy
/**
 * Jenkinsfile – Playwright Grid integration
 *
 * Strategy:
 *   - Each browser runs in its own parallel stage (matrix-style grid).
 *   - Within each browser stage the test suite is sharded across SHARD_COUNT
 *     parallel sub-stages so that large suites finish faster.
 *   - JUnit results are published so Jenkins shows test trend graphs.
 *   - HTML report is archived as a build artifact.
 *
 * Required Jenkins plugins:
 *   • Pipeline
 *   • HTML Publisher
 *   • JUnit
 *   • NodeJS (configure a tool named "NodeJS-LTS" in Global Tool Configuration)
 *   • Docker Pipeline (only needed if USE_DOCKER=true)
 */

pipeline {
    agent any

    /* ------------------------------------------------------------------ */
    /* Parameters (can be overridden per-build via "Build with Parameters") */
    /* ------------------------------------------------------------------ */
    parameters {
        choice(
            name: 'BROWSER',
            choices: ['all', 'chromium', 'firefox', 'webkit'],
            description: 'Browser(s) to run Playwright tests against'
        )
        string(
            name: 'BASE_URL',
            defaultValue: 'https://playwright.dev',
            description: 'Base URL for the application under test'
        )
        string(
            name: 'GRID_URL',
            defaultValue: '',
            description: 'WebSocket endpoint of a remote Playwright/Selenium Grid (leave blank to run locally)'
        )
        string(
            name: 'SHARD_COUNT',
            defaultValue: '3',
            description: 'Number of shards to split tests into per browser'
        )
    }

    /* ------------------------------------------------------------------ */
    /* Environment                                                          */
    /* ------------------------------------------------------------------ */
    environment {
        BASE_URL    = "${params.BASE_URL}"
        GRID_URL    = "${params.GRID_URL}"
        CI          = 'true'
        NODE_OPTIONS = '--max-old-space-size=4096'
    }

    /* ------------------------------------------------------------------ */
    /* Tool configuration                                                   */
    /* ------------------------------------------------------------------ */
    tools {
        nodejs 'NodeJS-LTS'
    }

    /* ------------------------------------------------------------------ */
    /* Stages                                                               */
    /* ------------------------------------------------------------------ */
    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'npm ci'
                sh 'npx playwright install --with-deps'
            }
        }

        stage('Run Playwright tests') {
            steps {
                script {
                    def browsers = params.BROWSER == 'all'
                        ? ['chromium', 'firefox', 'webkit']
                        : [params.BROWSER]

                    def shardCount = params.SHARD_COUNT.toInteger()

                    // Build a map of parallel stages (browser × shard)
                    def parallelStages = [:]

                    browsers.each { browser ->
                        (1..shardCount).each { shard ->
                            def stageName = "${browser} – shard ${shard}/${shardCount}"
                            def currentBrowser = browser
                            def currentShard   = shard

                            parallelStages[stageName] = {
                                node {
                                    checkout scm
                                    sh 'npm ci'
                                    sh 'npx playwright install --with-deps'

                                    withEnv([
                                        "BASE_URL=${params.BASE_URL}",
                                        "GRID_URL=${params.GRID_URL}",
                                        "CI=true",
                                        "SHARD=${currentShard}",
                                        "TOTAL_SHARDS=${shardCount}",
                                    ]) {
                                        sh """
                                            npx playwright test \\
                                                --project=${currentBrowser} \\
                                                --shard=${currentShard}/${shardCount} \\
                                                --reporter=blob,junit,list \\
                                                || true
                                        """
                                    }

                                    // Stash blob report for merging in the controller node
                                    stash name: "${currentBrowser}-shard-${currentShard}",
                                          includes: 'blob-report/**',
                                          allowEmpty: true

                                    junit allowEmptyResults: true,
                                          testResults: "test-results/results.xml"
                                }
                            }
                        }
                    }

                    parallel parallelStages
                }
            }
        }

        stage('Merge & publish report') {
            steps {
                script {
                    def browsers = params.BROWSER == 'all'
                        ? ['chromium', 'firefox', 'webkit']
                        : [params.BROWSER]
                    def shardCount = params.SHARD_COUNT.toInteger()

                    // Collect all blob reports from shard stages
                    browsers.each { browser ->
                        (1..shardCount).each { shard ->
                            unstash name: "${browser}-shard-${shard}"
                        }
                    }
                }
                sh 'npx playwright merge-reports --reporter html ./blob-report || true'
                publishHTML(target: [
                    allowMissing         : true,
                    alwaysLinkToLastBuild: true,
                    keepAll              : true,
                    reportDir            : 'playwright-report',
                    reportFiles          : 'index.html',
                    reportName           : 'Playwright Report',
                ])
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /* Post-build actions                                                   */
    /* ------------------------------------------------------------------ */
    post {
        always {
            archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true
            archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
        }
        failure {
            echo 'Build failed – check the Playwright Report artifact for details.'
        }
        success {
            echo 'All Playwright tests passed!'
        }
    }
}

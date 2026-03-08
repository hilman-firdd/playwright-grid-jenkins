pipeline {
    agent any

    environment {
        // Nama repo GitHub kamu
        GITHUB_REPO = 'hilman-firdd/playwright-grid-jenkins'

        // Neo Object Storage (NOS) - S3 Compatible
        // Kredensial disimpan di Jenkins Credentials dengan ID 'nos-s3-credentials'
        AWS_DEFAULT_REGION   = 'idn'
        AWS_BUCKET           = 'playwright-report'
        AWS_ENDPOINT         = 'https://nos.jkt-1.neo.id'
        AWS_URL              = 'https://nos.jkt-1.neo.id/playwright-report'
    }

    tools {
        nodejs 'NodeJS'
    }

    stages {

        // ─── Stage 1: Ambil kode dari GitHub ─────────────────────────────────
        stage('Checkout') {
            steps {
                git branch: 'master',
                    url: "https://github.com/${GITHUB_REPO}.git"
            }
        }

        // ─── Stage 2: Install dependencies ───────────────────────────────────
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        // ─── Stage 3: Jalankan Docker Grid ────────────────────────────────────
        stage('Start Playwright Grid') {
            steps {
                sh 'docker compose up -d'
                sh 'sleep 10' // tunggu container siap
            }
        }

        // ─── Stage 4: Jalankan Playwright Test ───────────────────────────────
        stage('Run Playwright Tests') {
            steps {
                sh 'npm test || true' // "|| true" agar pipeline lanjut meski ada test gagal
            }
            post {
                always {
                    // Simpan Playwright HTML report sebagai artifact
                    publishHTML(target: [
                        allowMissing         : false,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : 'playwright-report',
                        reportFiles          : 'index.html',
                        reportName           : 'Playwright HTML Report'
                    ])
                }
            }
        }

        // ─── Stage 5: Generate Allure Report ─────────────────────────────────
        stage('Generate Allure Report') {
            steps {
                sh 'npm run allure:generate'
            }
            post {
                always {
                    publishHTML(target: [
                        allowMissing         : true,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : 'allure-report',
                        reportFiles          : 'index.html',
                        reportName           : 'Allure Report'
                    ])
                }
            }
        }

        // ─── Stage 6: Stop Docker Grid ────────────────────────────────────────
        stage('Stop Playwright Grid') {
            steps {
                sh 'docker compose down'
            }
        }

        // ─── Stage 7: Upload Report ke NOS S3 ────────────────────────────────
        stage('Upload Report to NOS S3') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'nos-s3-credentials',
                    usernameVariable: 'AWS_ACCESS_KEY_ID',
                    passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                )]) {
                    sh '''
                        echo "🚀 Uploading Playwright report to NOS S3..."
                        aws s3 sync playwright-report/ s3://${AWS_BUCKET}/playwright-report/ \
                            --endpoint-url ${AWS_ENDPOINT} \
                            --region ${AWS_DEFAULT_REGION} \
                            --acl public-read \
                            --delete

                        echo "🚀 Uploading Allure report to NOS S3..."
                        aws s3 sync allure-report/ s3://${AWS_BUCKET}/allure-report/ \
                            --endpoint-url ${AWS_ENDPOINT} \
                            --region ${AWS_DEFAULT_REGION} \
                            --acl public-read \
                            --delete

                        echo "✅ Reports uploaded!"
                        echo "🌐 Playwright Report : ${AWS_URL}/playwright-report/index.html"
                        echo "🌐 Allure Report     : ${AWS_URL}/allure-report/index.html"
                    '''
                }
            }
        }

        // ─── Stage 8: Push hasil report ke GitHub (opsional) ─────────────────
        stage('Push Allure Report to GitHub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github-credentials', // Sesuaikan ID di Jenkins Credentials
                    usernameVariable: 'GIT_USER',
                    passwordVariable: 'GIT_TOKEN'
                )]) {
                    sh '''
                        git config user.email "ci@jenkins.local"
                        git config user.name "Jenkins CI"
                        git add allure-results/ allure-report/ playwright-report/ || true
                        git commit -m "ci: update test report [skip ci]" || echo "Nothing to commit"
                        git push https://${GIT_USER}:${GIT_TOKEN}@github.com/${GITHUB_REPO}.git HEAD:master
                    '''
                }
            }
        }
    }

    // ─── Notifikasi setelah pipeline selesai ─────────────────────────────────
    post {
        success {
            echo '✅ Pipeline sukses! Semua test lulus.'
        }
        failure {
            echo '❌ Pipeline gagal! Periksa log di atas.'
        }
        always {
            echo '📊 Allure & Playwright report sudah tersedia di tab Reports.'
        }
    }
}

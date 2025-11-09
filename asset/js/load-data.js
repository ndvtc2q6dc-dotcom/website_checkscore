// ========== 数据加载模块 ==========

// 自动加载所有数据
function autoLoadAllData() {
    autoLoadScreeningData();
    autoLoadScoreData();
    autoLoadRemainingData();
    
    // 先动态生成月份选项，然后再加载推荐榜数据
    populateWaitingMonthOptions();
    
    // 数据加载完成后自动运行分析
    setTimeout(() => {
        if (screeningData.length > 0 && scoreData.length > 0) {
            performAnalysis();
        }
    }, 2000);
}

// 自动加载余刑数据
function autoLoadRemainingData() {
    // 尝试加载最新月份的文件，如果失败则回退到旧格式
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const fileName = `余刑数据_${year}年${month}月.json`;
    
    fetch('data/' + fileName)
        .then(response => {
            if (!response.ok) {
                // 如果新格式文件不存在，尝试旧格式
                return fetch('data/余刑数据.json');
            }
            return response;
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            remainingData = data;
        })
        .catch(error => {
            console.error('加载余刑数据失败:', error);
        });
}

// 自动加载推荐榜数据（已废弃，现在由populateWaitingMonthOptions自动触发）
function autoLoadRecommendationData() {
    const monthSelect = document.getElementById('waitingMonth');
    if (monthSelect && monthSelect.value) {
        loadRecommendationDataForMonth(monthSelect.value);
    }
}

// 导出推荐榜数据
function exportRecommendationData() {
    if (!checkAdminPermission()) return;
    const csv = convertToCSV(recommendationData);
    downloadCSV(csv, '减刑假释推荐榜.csv');
}

function exportRecommendationJSON() {
    exportDataAsJSON(recommendationData, '减刑假释推荐榜.json');
}

// 导出余刑数据
function exportRemainingData() {
    if (!checkAdminPermission()) return;
    const csv = convertToCSV(remainingData);
    downloadCSV(csv, '余刑数据.csv');
}

function exportRemainingJSON() {
    exportDataAsJSON(remainingData, '余刑数据.json');
}


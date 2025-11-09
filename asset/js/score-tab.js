// ========== 罪犯加扣分公示表模块 ==========

// 分页控制
function prevScorePage() {
    if (currentScorePage > 1) {
        currentScorePage--;
        displayScoreData();
    }
}

function nextScorePage() {
    const totalPages = Math.ceil(filteredScoreData.length / itemsPerPage);
    if (currentScorePage < totalPages) {
        currentScorePage++;
        displayScoreData();
    }
}

// 更新罪犯加扣分统计信息
function updateScoreStats() {
    const total = scoreData.length;
    const deduction = scoreData.filter(item => item.类型 === '扣分').length;
    const prisoners = new Set(scoreData.map(item => item.罪犯编号)).size;
    
    document.getElementById('scoreTotal').textContent = total;
    document.getElementById('scoreDeduction').textContent = deduction;
    document.getElementById('scorePrisoners').textContent = prisoners;
}

// 填充罪犯加扣分筛选选项
function populateScoreFilters() {
    const prisonSelect = document.getElementById('scorePrison');
    const categorySelect = document.getElementById('scoreCategory');
    
    const prisons = [...new Set(scoreData.map(item => item.所属监区))].filter(Boolean);
    
    prisons.sort((a, b) => {
        const aNum = a.match(/(\d+)/);
        const bNum = b.match(/(\d+)/);
        
        if (aNum && bNum) {
            return parseInt(aNum[1]) - parseInt(bNum[1]);
        }
        
        return a.localeCompare(b, 'zh-CN');
    });
    
    prisonSelect.innerHTML = '<option value="">全部分监区</option>';
    prisons.forEach(prison => {
        const option = document.createElement('option');
        option.value = prison;
        option.textContent = prison;
        prisonSelect.appendChild(option);
    });
    
    const categories = [...new Set(scoreData.map(item => item.类别))].filter(Boolean);
    categorySelect.innerHTML = '<option value="">全部类别</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

// 防抖版本的搜索函数
const debouncedFilterScoreData = debounce(filterScoreData, 300);

// 验证扣分记录时间范围
function validateScoreDateRange() {
    const dateFrom = document.getElementById('scoreDateFrom').value;
    const dateTo = document.getElementById('scoreDateTo').value;
    
    if (dateFrom && dateTo && dateFrom > dateTo) {
        alert('开始时间不能晚于结束时间，请重新选择！');
        document.getElementById('scoreDateTo').value = '';
        return false;
    }
    return true;
}

// 筛选罪犯加扣分数据
function filterScoreData() {
    const search = document.getElementById('scoreSearch').value.toLowerCase();
    const prison = document.getElementById('scorePrison').value;
    const category = document.getElementById('scoreCategory').value;
    const dateFrom = document.getElementById('scoreDateFrom').value;
    const dateTo = document.getElementById('scoreDateTo').value;
    const valueMin = parseFloat(document.getElementById('scoreValueMin').value) || 0;
    const valueMax = parseFloat(document.getElementById('scoreValueMax').value) || Infinity;

    if (!validateDateRange(dateFrom, dateTo)) {
        return;
    }

    filteredScoreData = scoreData.filter(item => {
        const matchesSearch = !search || 
            (item.罪犯姓名 && item.罪犯姓名.toLowerCase().includes(search)) ||
            (item.罪犯编号 && item.罪犯编号.toString().includes(search)) ||
            (item.罪犯姓名 && getInitials(item.罪犯姓名).toLowerCase().includes(search));
        const matchesPrison = !prison || item.所属监区 === prison;
        const matchesCategory = !category || item.类别 === category;
        const matchesDate = (!dateFrom || (item.创建时间 ? item.创建时间.split(' ')[0] : item.所属日期) >= dateFrom) && (!dateTo || (item.创建时间 ? item.创建时间.split(' ')[0] : item.所属日期) <= dateTo);
        const matchesValue = (parseFloat(item.分值) || 0) >= valueMin && (parseFloat(item.分值) || 0) <= valueMax;

        return matchesSearch && matchesPrison && matchesCategory && matchesDate && matchesValue;
    });

    currentScorePage = 1;
    displayScoreData();
}

// 重置罪犯加扣分筛选条件
function resetScoreFilters() {
    document.getElementById('scoreSearch').value = '';
    document.getElementById('scorePrison').value = '';
    document.getElementById('scoreCategory').value = '';
    document.getElementById('scoreDateFrom').value = '';
    document.getElementById('scoreDateTo').value = '';
    document.getElementById('scoreValueMin').value = '';
    document.getElementById('scoreValueMax').value = '';
    
    filteredScoreData = [...scoreData];
    currentScorePage = 1;
    displayScoreData();
}

// 显示罪犯加扣分数据
function displayScoreData() {
    const tbody = document.getElementById('scoreTableBody');
    const startIndex = (currentScorePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredScoreData.slice(startIndex, endIndex);

    tbody.innerHTML = '';
    
    // 使用DocumentFragment减少DOM重绘
    var fragment = document.createDocumentFragment();
    
    for (var index = 0; index < pageData.length; index++) {
        var item = pageData[index];
        var row = document.createElement('tr');
        var displayIndex = startIndex + index + 1;
        
        var fact = item.事实 || '';
        var factDisplay = fact.length > 50 ? fact.substring(0, 50) + '...' : fact;
        
        var typeColor = item.类型 === '扣分' ? '#dc3545' : '#3b82f6';
        
        row.innerHTML = '<td>' + displayIndex + '</td>' +
            '<td>' + (item.罪犯编号 || '') + '</td>' +
            '<td>' + (item.罪犯姓名 || '') + '</td>' +
            '<td>' + (item.所属监区 || '') + '</td>' +
            '<td>' + (item.创建时间 || '') + '</td>' +
            '<td title="' + fact + '">' + factDisplay + '</td>' +
            '<td><span style="color: ' + typeColor + '">' + (item.类型 || '') + '</span></td>' +
            '<td>' + (item.类别 || '') + '</td>' +
            '<td>' + (item.分值 || '') + '</td>' +
            '<td>' + (item.创建人 || '') + '</td>';
        fragment.appendChild(row);
    }
    
    tbody.appendChild(fragment);

    updateScorePagination();
}

// 更新罪犯加扣分分页
function updateScorePagination() {
    updatePagination(filteredScoreData.length, currentScorePage, itemsPerPage, 'scorePagination', displayScoreData, 'currentScorePage');
}

// 导出罪犯加扣分数据
function exportScoreData() {
    if (!checkAdminPermission()) return;
    const dataToExport = filteredScoreData.length > 0 ? filteredScoreData : scoreData;
    const csv = convertToCSV(dataToExport);
    downloadCSV(csv, '罪犯加扣分公示表.csv');
}

// 导出罪犯加扣分数据 - JSON格式
function exportScoreJSON() {
    const dataToExport = filteredScoreData.length > 0 ? filteredScoreData : scoreData;
    exportDataAsJSON(dataToExport, '罪犯加扣分公示表.json');
}

// 自动加载罪犯加扣分公示表数据
function autoLoadScoreData() {
    // 尝试加载最新月份的文件，如果失败则回退到旧格式
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const fileName = `罪犯加扣分公示表_${year}年${month}月.json`;
    
    fetch('data/' + fileName)
        .then(response => {
            if (!response.ok) {
                // 如果新格式文件不存在，尝试旧格式
                return fetch('data/罪犯加扣分公示表.json');
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
            scoreData = data;
            filteredScoreData = [...scoreData];
            updateScoreStats();
            populateScoreFilters();
            displayScoreData();
            
            const contentElement = document.getElementById('score-content');
            if (contentElement) {
                contentElement.style.display = 'block';
            }
            
            // 如果有筛查数据，重新运行分析
            if (screeningData.length > 0 && document.getElementById('timeRangeType')) {
                performAnalysis();
            }
        })
        .catch(error => {
            console.error('加载罪犯加扣分公示表数据失败:', error);
        });
}


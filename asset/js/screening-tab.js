// ========== 减刑筛查数据模块 ==========

// 分页控制
function prevScreeningPage() {
    if (currentScreeningPage > 1) {
        currentScreeningPage--;
        displayScreeningData();
    }
}

function nextScreeningPage() {
    const totalPages = Math.ceil(filteredScreeningData.length / itemsPerPage);
    if (currentScreeningPage < totalPages) {
        currentScreeningPage++;
        displayScreeningData();
    }
}

// 更新减刑筛查统计信息
function updateScreeningStats() {
    const total = screeningData.length;
    const eligible = screeningData.filter(item => {
        const conclusion = item.减刑推测结论 || '';
        return conclusion.includes('符合申报条件');
    }).length;
    
    document.getElementById('screeningTotal').textContent = total;
    document.getElementById('screeningEligible').textContent = eligible;
}

// 填充减刑筛查筛选选项
function populateScreeningFilters() {
    const crimeSelect = document.getElementById('screeningCrime');
    const crimes = [...new Set(screeningData.map(item => item.罪名))].filter(Boolean);
    
    crimeSelect.innerHTML = '<option value="">全部罪名</option>';
    crimes.forEach(crime => {
        const option = document.createElement('option');
        option.value = crime;
        option.textContent = crime;
        crimeSelect.appendChild(option);
    });
}

// 防抖版本的搜索函数
const debouncedFilterScreeningData = debounce(filterScreeningData, 300);

// 筛选减刑筛查数据
function filterScreeningData() {
    const search = document.getElementById('screeningSearch').value.toLowerCase();
    const crime = document.getElementById('screeningCrime').value;
    const conclusion = document.getElementById('screeningConclusion').value;

    filteredScreeningData = screeningData.filter(item => {
        const matchesSearch = !search || 
            (item.姓名 && item.姓名.toLowerCase().includes(search)) ||
            (item.囚号 && item.囚号.toString().includes(search)) ||
            (item.姓名 && getInitials(item.姓名).toLowerCase().includes(search));
        const matchesCrime = !crime || item.罪名 === crime;
        let matchesConclusion = true;
        if (conclusion) {
            const conclusionText = item.减刑推测结论 || '';
            if (conclusion === '符合申报条件') {
                matchesConclusion = conclusionText.includes('符合申报条件');
            } else if (conclusion === '立即启动') {
                matchesConclusion = conclusionText.includes('立即启动');
            } else if (conclusion === '其他') {
                matchesConclusion = !conclusionText.includes('符合申报条件') && !conclusionText.includes('立即启动');
            }
        }
        return matchesSearch && matchesCrime && matchesConclusion;
    });

    currentScreeningPage = 1;
    displayScreeningData();
}

// 重置减刑筛查筛选条件
function resetScreeningFilters() {
    document.getElementById('screeningSearch').value = '';
    document.getElementById('screeningCrime').value = '';
    document.getElementById('screeningConclusion').value = '';
    
    filteredScreeningData = [...screeningData];
    currentScreeningPage = 1;
    displayScreeningData();
}

// 显示减刑筛查数据
function displayScreeningData() {
    console.log(`显示减刑筛查数据: 当前页 ${currentScreeningPage}, 每页 ${itemsPerPage}, 数据长度 ${filteredScreeningData.length}`);
    const tbody = document.getElementById('screeningTableBody');
    if (!tbody) return;
    
    const startIndex = (currentScreeningPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredScreeningData.slice(startIndex, endIndex);

    console.log(`分页数据: 开始索引 ${startIndex}, 结束索引 ${endIndex}, 页面数据长度 ${pageData.length}`);

    tbody.innerHTML = '';
    
    // 使用DocumentFragment减少DOM重绘
    var fragment = document.createDocumentFragment();
    
    for (var index = 0; index < pageData.length; index++) {
        var item = pageData[index];
        var row = document.createElement('tr');
        var displayIndex = startIndex + index + 1;
        
        var conclusionColor = '';
        var conclusion = item.减刑推测结论 || '';
        if (conclusion.indexOf('符合申报条件') !== -1) {
            conclusionColor = '#3b82f6';
        } else {
            conclusionColor = '#dc3545';
        }
        
        row.innerHTML = '<td>' + displayIndex + '</td>' +
            '<td>' + (item.姓名 || '') + '</td>' +
            '<td>' + (item.囚号 || '') + '</td>' +
            '<td>' + (item.罪名 || '') + '</td>' +
            '<td>' + (item.原判刑期 || '') + '</td>' +
            '<td>' + (item.减刑次数 || '') + '</td>' +
            '<td>' + (item.考核月数 || '') + '</td>' +
            '<td><span style="color: ' + conclusionColor + '">' + conclusion + '</span></td>' +
            '<td>' + (item.备注 || '') + '</td>';
        fragment.appendChild(row);
    }
    
    tbody.appendChild(fragment);

    updateScreeningPagination();
}

// 更新减刑筛查分页
function updateScreeningPagination() {
    updatePagination(filteredScreeningData.length, currentScreeningPage, itemsPerPage, 'screeningPagination', displayScreeningData, 'currentScreeningPage');
}

// 导出减刑筛查数据
function exportScreeningData() {
    if (!checkAdminPermission()) return;
    const dataToExport = filteredScreeningData.length > 0 ? filteredScreeningData : screeningData;
    const csv = convertToCSV(dataToExport);
    downloadCSV(csv, '减刑筛查数据.csv');
}

// 导出减刑筛查数据 - JSON格式
function exportScreeningJSON() {
    const dataToExport = filteredScreeningData.length > 0 ? filteredScreeningData : screeningData;
    exportDataAsJSON(dataToExport, '减刑筛查数据.json');
}

// 自动加载减刑筛查数据
function autoLoadScreeningData() {
    // 动态生成最近24个月的文件列表（按时间倒序），确保能找到最近的任何文件
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    
    // 构建要尝试的文件列表：从当前月开始，往前推24个月
    const fileNames = [];
    
    // 生成最近24个月的文件名（按时间倒序，最新的在前）
    for (let i = 0; i < 24; i++) {
        let year = currentYear;
        let month = currentMonth - i;
        
        // 处理跨年的情况
        while (month < 1) {
            month += 12;
            year -= 1;
        }
        
        const fileName = `减刑筛查_${year}年${String(month).padStart(2, '0')}月.json`;
        fileNames.push(fileName);
    }
    
    // 最后添加旧格式作为兜底
    fileNames.push('减刑筛查.json');
    
    console.log(`准备尝试加载减刑筛查数据，共 ${fileNames.length} 个候选文件（从最新月份开始）`);
    
    // 递归尝试加载文件
    function tryLoadFile(index) {
        if (index >= fileNames.length) {
            console.error('所有减刑筛查数据文件加载失败');
            return;
        }
        
        const fileName = fileNames[index];
        console.log(`尝试加载减刑筛查数据 [${index + 1}/${fileNames.length}]: data/${fileName}`);
        
        fetch('data/' + fileName)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    // 文件不存在，尝试下一个
                    if (index < fileNames.length - 1) {
                        console.log(`文件 ${fileName} 不存在，尝试下一个...`);
                        tryLoadFile(index + 1);
                        // 返回一个永远不会resolve的Promise，阻止后续then执行
                        return new Promise(() => {});
                    } else {
                        throw new Error(`所有文件加载失败，最后一个错误: HTTP ${response.status}`);
                    }
                }
            })
            .then(data => {
                // 只有在上一步成功返回data时才会执行这里
                if (data && Array.isArray(data)) {
                    console.log(`✓ 成功加载减刑筛查数据: ${fileName}, 共 ${data.length} 条记录`);
                    screeningData = data;
                    filteredScreeningData = [...screeningData];
                    updateScreeningStats();
                    populateScreeningFilters();
                    displayScreeningData();
                    
                    const contentElement = document.getElementById('screening-content');
                    if (contentElement) {
                        contentElement.style.display = 'block';
                    }
                    
                    // 如果有分析数据，重新运行分析
                    if (scoreData.length > 0 && document.getElementById('timeRangeType')) {
                        performAnalysis();
                    }
                } else if (data !== undefined) {
                    // 数据格式错误，尝试下一个
                    if (index < fileNames.length - 1) {
                        console.log(`文件 ${fileName} 数据格式错误，尝试下一个...`);
                        tryLoadFile(index + 1);
                    } else {
                        throw new Error('数据格式错误：不是数组');
                    }
                }
            })
            .catch(error => {
                // 如果是最后一个文件，才输出错误
                if (index >= fileNames.length - 1) {
                    console.error('加载减刑筛查数据失败:', error);
                } else {
                    // 否则尝试下一个文件
                    tryLoadFile(index + 1);
                }
            });
    }
    
    // 从第一个文件开始尝试
    tryLoadFile(0);
}


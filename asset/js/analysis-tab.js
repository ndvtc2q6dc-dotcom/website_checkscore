// ========== 考核期扣分模块 ==========

// 分页控制
function prevAnalysisPage() {
    if (currentAnalysisPage > 1) {
        currentAnalysisPage--;
        displayAnalysisData();
    }
}

function nextAnalysisPage() {
    var totalPages = Math.ceil(analysisData.length / itemsPerPage);
    if (currentAnalysisPage < totalPages) {
        currentAnalysisPage++;
        displayAnalysisData();
    }
}

// 更新分析分页
function updateAnalysisPagination() {
    updatePagination(analysisData.length, currentAnalysisPage, itemsPerPage, 'analysisPagination', displayAnalysisData, 'currentAnalysisPage');
}

// 更新时间范围描述
function updateTimeRangeDescription() {
    var timeRangeType = document.getElementById('timeRangeType').value;
    var filterCondition = document.getElementById('filterCondition').value;
    var description = document.getElementById('timeRangeDescription');
    
    var timeDesc = timeRangeType === 'recent' ? '考核期止日前半年至今' : '考核期止日前一年至今';
    
    if (filterCondition === 'lifesentence') {
        description.textContent = '将分析余刑为无期的人员';
    } else {
        var countDesc = filterCondition === 'count1' ? '1次' : '2次及以上';
        description.textContent = '将分析' + timeDesc + '内扣分次数' + (filterCondition === 'count1' ? '等于' : '大于等于') + countDesc + '的人员';
    }
    
    // 更新统计标签
    var labelElement = document.getElementById('analysisDeductionLabel');
    if (labelElement) {
        if (filterCondition === 'count1') {
            labelElement.textContent = '扣分次数=1次人数';
        } else if (filterCondition === 'lifesentence') {
            labelElement.textContent = '余刑为无期人数';
        } else {
            labelElement.textContent = '扣分次数≥2次人数';
        }
    }
    
    // 自动运行分析
    if (screeningData.length > 0 && scoreData.length > 0) {
        performAnalysis();
    }
}

// 执行分析
function performAnalysis() {
    const timeRangeType = document.getElementById('timeRangeType').value;
    const filterCondition = document.getElementById('filterCondition').value;
    const minDeductionCount = filterCondition === 'count1' ? 1 : 2;
    const exactCount = filterCondition === 'count1';
    const isLifeSentence = filterCondition === 'lifesentence';
    
    let qualifiedPersons = screeningData.filter(person => {
        const conclusion = person.减刑推测结论 || '';
        return conclusion.includes('符合申报条件');
    });
    
    // 如果是余刑为无期的筛选
    if (isLifeSentence) {
        const lifeSentencePersons = remainingData.filter(person => {
            if (person.囚号 === '罪犯编号' || person.姓名 === '姓名' || person.余刑 === '剩余刑期') return false;
            const remainingSentence = person.余刑 || '';
            return remainingSentence.includes('无期') || remainingSentence.includes('无期徒刑');
        });
        
        qualifiedPersons = lifeSentencePersons.map(remainingPerson => {
            const matchedPerson = screeningData.find(screeningPerson => 
                (screeningPerson.囚号 && remainingPerson.囚号 && screeningPerson.囚号.toString() === remainingPerson.囚号.toString()) ||
                (screeningPerson.姓名 && remainingPerson.姓名 && screeningPerson.姓名 === remainingPerson.姓名)
            );
            
            if (matchedPerson) {
                return matchedPerson;
            } else {
                return {
                    序号: '',
                    姓名: remainingPerson.姓名 || '',
                    囚号: remainingPerson.囚号 || '',
                    罪名: '',
                    减刑推测结论: '余刑为无期',
                    备注: ''
                };
            }
        });
    }
    
    const analysisResults = [];
    let totalAnalyzed = 0;
    
    if (isLifeSentence) {
        qualifiedPersons.forEach((person, index) => {
            const prisonerId = person.囚号;
            const prisonerName = person.姓名;
            
            if (!prisonerId) return;
            
            const now = new Date();
            const sixMonthsAgo = new Date(now);
            sixMonthsAgo.setMonth(now.getMonth() - 6);
            
            const analysisStart = sixMonthsAgo.toISOString().split('T')[0];
            const analysisEnd = now.toISOString().split('T')[0];
            
            const personDeductions = scoreData.filter(record => {
                const recordPrisonerId = record.罪犯编号;
                const recordDate = record.创建时间 ? record.创建时间.split(' ')[0] : record.所属日期;
                const recordType = record.类型 || '';
                
                if (!recordPrisonerId || !recordDate) return false;
                
                const idMatch = recordPrisonerId.toString() === prisonerId.toString();
                const typeMatch = recordType === '扣分';
                const dateMatch = recordDate >= analysisStart && recordDate <= analysisEnd;
                
                return idMatch && typeMatch && dateMatch;
            });
            
            const totalDeduction = personDeductions.reduce((sum, record) => {
                const deduction = parseFloat(record.分值 || 0);
                return sum + (isNaN(deduction) ? 0 : deduction);
            }, 0);
            
            const deductionCount = personDeductions.length;
            
            analysisResults.push({
                序号: analysisResults.length + 1,
                姓名: person.姓名 || '',
                囚号: person.囚号 || '',
                罪名: isLifeSentence ? '' : (person.罪名 || ''),
                分析时间段: `${analysisStart} 至 ${analysisEnd}`,
                总扣分: totalDeduction,
                扣分记录数: deductionCount,
                扣分详情: personDeductions.map(record => ({
                    扣分日期: record.创建时间 ? record.创建时间.split(' ')[0] : record.所属日期 || '',
                    扣分事实: record.事实 || '',
                    扣分类别: record.类别 || '',
                    扣分分值: parseFloat(record.分值 || 0),
                    创建人: record.创建人 || ''
                })),
                减刑推测结论: person.减刑推测结论 || '余刑为无期',
                备注: person.备注 || ''
            });
            
            totalAnalyzed++;
        });
    } else {
        qualifiedPersons.forEach(person => {
            const prisonerId = person.囚号;
            const prisonerName = person.姓名;
            
            if (!prisonerId) return;
            
            let analysisStart, analysisEnd;
            
            if (timeRangeType === 'recent') {
                const today = new Date();
                analysisEnd = today.toISOString().split('T')[0];
                const eightMonthsAgo = new Date(today);
                eightMonthsAgo.setMonth(today.getMonth() - 8);
                analysisStart = eightMonthsAgo.toISOString().split('T')[0];
            } else {
                const qualificationDate = parseQualificationDate(person.减刑推测结论);
                if (!qualificationDate) return;
                
                const endDate = new Date(qualificationDate);
                endDate.setMonth(endDate.getMonth() + 1, 1);
                analysisEnd = endDate.toISOString().split('T')[0];
                
                const startDate = new Date(endDate);
                startDate.setMonth(startDate.getMonth() - 14); // 一年两个月 = 14个月
                analysisStart = startDate.toISOString().split('T')[0];
            }
            
            const deductionRecords = [];
            let totalDeduction = 0;
            
            scoreData.forEach(record => {
                const recordPrisonerId = record.罪犯编号;
                const recordDate = record.创建时间 ? record.创建时间.split(' ')[0] : record.所属日期;
                const recordType = record.类型 || '';
                const recordValue = parseFloat(record.分值) || 0;
                
                if (String(recordPrisonerId) === String(prisonerId) && 
                    recordType === '扣分' && 
                    recordDate && 
                    recordDate >= analysisStart && 
                    recordDate <= analysisEnd) {
                    
                    totalDeduction += recordValue;
                    deductionRecords.push({
                        扣分日期: recordDate,
                        扣分事实: record.事实 || '',
                        扣分类别: record.类别 || '',
                        扣分分值: recordValue,
                        创建人: record.创建人 || ''
                    });
                }
            });
            
            totalAnalyzed++;
            
            const meetsCondition = exactCount ? (deductionRecords.length === minDeductionCount) : (deductionRecords.length >= minDeductionCount);
            if (meetsCondition) {
                analysisResults.push({
                    序号: analysisResults.length + 1,
                    姓名: prisonerName,
                    囚号: prisonerId,
                    罪名: isLifeSentence ? '' : (person.罪名 || ''),
                    分析时间段: `${analysisStart} 至 ${analysisEnd}`,
                    总扣分: totalDeduction,
                    扣分记录数: deductionRecords.length,
                    扣分详情: deductionRecords,
                    减刑推测结论: person.减刑推测结论 || '',
                    备注: person.备注 || ''
                });
            }
        });
    }
    
    // 对于余刑为无期的情况，按扣分记录数降序排列（有扣分的排在前面）
    if (isLifeSentence) {
        analysisResults.sort((a, b) => (b.扣分记录数 || 0) - (a.扣分记录数 || 0));
        // 重新设置序号
        analysisResults.forEach((item, index) => {
            item.序号 = index + 1;
        });
    }
    
    analysisData = analysisResults;
    
    generateAnalysisReport(analysisResults, qualifiedPersons, timeRangeType, minDeductionCount);
    
    let statusText;
    if (isLifeSentence) {
        statusText = `分析完成！共发现 ${analysisResults.length} 名余刑为无期的人员`;
    } else {
        statusText = exactCount ? 
            `分析完成！共发现 ${analysisResults.length} 名扣分次数等于${minDeductionCount}次的人员` :
            `分析完成！共发现 ${analysisResults.length} 名扣分次数大于等于${minDeductionCount}次的人员`;
    }
    
    toggleTableColumns();
    updateAnalysisStats();
    displayAnalysisData();
    
    const contentElement = document.getElementById('analysis-content');
    if (contentElement) {
        contentElement.style.display = 'block';
    }
}

// 解析减刑推测结论中的日期
function parseQualificationDate(conclusionText) {
    if (!conclusionText) return null;
    
    const datePattern = /(\d{4}\.\d{1,2}\.\d{1,2})/;
    const match = conclusionText.match(datePattern);
    
    if (match) {
        const dateStr = match[1];
        try {
            const dateObj = new Date(dateStr.replace(/\./g, '-'));
            return dateObj.toISOString().split('T')[0];
        } catch (e) {
            return null;
        }
    }
    
    return null;
}

// 生成分析报告
function generateAnalysisReport(analysisResults, qualifiedPersons, timeRangeType, minDeductionCount) {
    const now = new Date();
    const timeRangeDesc = timeRangeType === 'recent' ? '考核期止日前半年至今' : '考核期止日前一年至今';
    const filterCondition = document.getElementById('filterCondition').value;
    const isLifeSentence = filterCondition === 'lifesentence';
    
    let filterDesc;
    if (isLifeSentence) {
        filterDesc = '余刑为无期';
    } else {
        filterDesc = `扣分次数 ≥ ${minDeductionCount}次`;
    }
    
    analysisReport = {
        分析时间: now.toLocaleString('zh-CN'),
        分析参数: {
            时间范围: isLifeSentence ? '余刑为无期' : timeRangeDesc,
            筛选条件: filterDesc
        },
        分析概要: {
            扣分次数达标人数: analysisResults.length
        }
    };
}

// 更新分析统计信息
function updateAnalysisStats() {
    if (analysisReport.分析概要) {
        document.getElementById('analysisDeduction').textContent = analysisReport.分析概要.扣分次数达标人数 || 0;
    }
}

// 切换表格列显示
function toggleTableColumns() {
    const filterCondition = document.getElementById('filterCondition').value;
    const crimeColumns = document.querySelectorAll('.crime-column');
    
    crimeColumns.forEach(col => {
        if (filterCondition === 'lifesentence') {
            col.style.display = 'none';
        } else {
            col.style.display = '';
        }
    });
}

// 显示分析数据
function displayAnalysisData() {
    const tbody = document.getElementById('analysisTableBody');
    if (!tbody) return;
    
    const startIndex = (currentAnalysisPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = analysisData.slice(startIndex, endIndex);
    
    tbody.innerHTML = '';
    const isLifeSentence = document.getElementById('filterCondition').value === 'lifesentence';
    
    // 使用DocumentFragment减少DOM重绘
    var fragment = document.createDocumentFragment();
    
    for (var index = 0; index < pageData.length; index++) {
        var item = pageData[index];
        var row = document.createElement('tr');
        var displayIndex = startIndex + index + 1;
        
        var riskLevel = item.扣分记录数 > 3 ? 'high-risk' : item.扣分记录数 > 1 ? 'medium-risk' : 'low-risk';
        var hasDeductions = (item.扣分记录数 || 0) > 0;
        
        // 对于余刑为无期且有扣分记录的情况，添加背景色区分
        if (isLifeSentence && hasDeductions) {
            row.classList.add('has-deduction');
        }
        
        // 对于余刑为无期且没有扣分记录的情况，隐藏查看详情按钮
        var detailButton;
        if (!isLifeSentence || hasDeductions) {
            detailButton = '<button class="btn btn-small" onclick="showAnalysisDetails(' + item.序号 + ')">查看详情</button>';
        } else {
            detailButton = '<span style="color: #999;">无扣分记录</span>';
        }
        
        var crimeDisplay = isLifeSentence ? 'none' : '';
        
        row.innerHTML = '<td>' + displayIndex + '</td>' +
            '<td>' + (item.姓名 || '') + '</td>' +
            '<td>' + (item.囚号 || '') + '</td>' +
            '<td class="crime-column" style="display: ' + crimeDisplay + ';">' + (item.罪名 || '') + '</td>' +
            '<td>' + (item.分析时间段 || '') + '</td>' +
            '<td>' + (item.总扣分 || 0) + '</td>' +
            '<td class="' + riskLevel + '">' + (item.扣分记录数 || 0) + '</td>' +
            '<td>' + (item.减刑推测结论 || '') + '</td>' +
            '<td>' + (item.备注 || '') + '</td>' +
            '<td>' + detailButton + '</td>';
        fragment.appendChild(row);
    }
    
    tbody.appendChild(fragment);
    
    updateAnalysisPagination();
}

// 显示分析详情
function showAnalysisDetails(index) {
    const person = analysisData.find(p => p.序号 === index);
    if (!person) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${person.姓名} ${person.囚号 ? `(${person.囚号})` : ''} - 扣分详情</h2>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="deduction-stats">
                    <p><strong>分析时间段：</strong>${person.分析时间段}</p>
                    <p><strong>总扣分：</strong>${person.总扣分}</p>
                    <p><strong>扣分记录数：</strong>${person.扣分记录数}</p>
                </div>
                <h4 class="table-title">扣分记录详情</h4>
                <table class="deduction-details-table">
                    <thead>
                        <tr>
                            <th>扣分日期</th>
                            <th>扣分事实</th>
                            <th>扣分类别</th>
                            <th>扣分分值</th>
                            <th>创建人</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${person.扣分详情.map(detail => `
                            <tr>
                                <td class="deduction-date">${detail.扣分日期}</td>
                                <td class="deduction-fact">
                                    <span class="fact-text" data-full-text="${detail.扣分事实}" data-truncated="true" onclick="toggleFactText(this)">
                                        ${detail.扣分事实.substring(0, 50)}${detail.扣分事实.length > 50 ? '...' : ''}
                                    </span>
                                </td>
                                <td class="category-cell ${getCategoryClass(detail.扣分类别)}">${detail.扣分类别}</td>
                                <td class="deduction-score">${detail.扣分分值}</td>
                                <td class="creator">${detail.创建人}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">关闭</button>
            </div>
        </div>
    `;
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
}

// 导出分析数据
function exportAnalysisData() {
    if (!checkAdminPermission()) return;
    const csv = convertAnalysisToCSV(analysisData);
    downloadCSV(csv, '考核期扣分分析结果.csv');
}

// 导出分析报告
function exportAnalysisReport() {
    if (!checkAdminPermission()) return;
    if (analysisReport.分析概要) {
        const reportText = `分析报告\n${'='.repeat(50)}\n\n` +
            `分析时间：${analysisReport.分析时间}\n` +
            `分析参数：\n` +
            `  时间范围：${analysisReport.分析参数.时间范围}\n` +
            `  筛选条件：${analysisReport.分析参数.筛选条件}\n\n` +
            `分析概要：\n` +
            `  扣分次数达标人数：${analysisReport.分析概要.扣分次数达标人数}\n`;
        
        const blob = new Blob(['\ufeff' + reportText], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', '考核期扣分分析报告.txt');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 转换分析数据为CSV
function convertAnalysisToCSV(data) {
    if (data.length === 0) return '';
    
    const csvRows = [];
    
    data.forEach(item => {
        const row = [
            item.序号 || '',
            `"${item.姓名 || ''}"`,
            item.囚号 || '',
            `"${item.罪名 || ''}"`,
            `"${item.分析时间段 || ''}"`,
            item.总扣分 || 0,
            item.扣分记录数 || 0,
            `"${item.减刑推测结论 || ''}"`,
            `"${item.备注 || ''}"`
        ];
        csvRows.push(row.join(','));
    });
    
    const headers = ['序号', '姓名', '囚号', '罪名', '分析时间段', '总扣分', '扣分记录数', '减刑推测结论', '备注'];
    
    return [headers.join(','), ...csvRows].join('\n');
}


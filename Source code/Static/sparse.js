$(document).ready(function() {
    $('#db-form').on('submit', function(e) {
        e.preventDefault();
        $.ajax({
            type: 'POST',
            url: '/submit_db_details',
            data: $(this).serialize(),
            success: function(response) {
                if (response.success) {
                    $('#form-container').hide();
                    $('#tables-container').show();
                    $('#tables-list').empty();
                    response.tables.forEach(function(table) {
                        $('#tables-list').append('<li>' + table + '</li>');
                    });
                    showNotification();
                } else {
                    $('#notification-db').html('<div class="error">' + response.message + '</div>');
                }
            }
        });
    });

    $('#continue-btn').on('click', function() {
        $('#tables-container').hide();
        $('#query-container').show();
    });

    $('#query-form').on('submit', function(e) {
        e.preventDefault();
        clearCharts(); // Clear existing charts
        resetVisualizationOptions(); // Reset visualization options
        $.ajax({
            type: 'POST',
            url: '/submit_query',
            data: $(this).serialize(),
            success: function(response) {
                if (response.success) {
                    var resultsHtml = '<table><thead><tr>';
                    // Add column headers
                    var columns = Object.keys(response.data[0]);
                    columns.forEach(function(col) {
                        resultsHtml += '<th>' + col + '</th>';
                    });
                    resultsHtml += '</tr></thead><tbody>';
                    response.data.forEach(function(row) {
                        resultsHtml += '<tr>';
                        columns.forEach(function(col) {
                            resultsHtml += '<td>' + row[col] + '</td>';
                        });
                        resultsHtml += '</tr>';
                    });
                    resultsHtml += '</tbody></table>';
                    $('#query-results').html(resultsHtml);
                    $('#download-btn').show();
                    $('#visualize-btn').show();

                    // Populate axis options
                    populateAxisOptions(columns);
                } else {
                    $('#notification-query').html('<div class="error">' + response.message + '</div>');
                }
            }
        });
    });
});

function clearCharts() {
    $('#bar-chart').hide();
    $('#download-bar').hide();
    $('#line-chart').hide();
    $('#download-line').hide();
    $('#scatter-chart').hide();
    $('#download-scatter').hide();
    $('#pie-chart').hide();
    $('#download-pie').hide();
    $('#histogram-chart').hide();
    $('#download-histogram').hide();
    $('#doughnut-chart').hide();
    $('#download-doughnut').hide();
    $('#treemap-chart').hide();
    $('#download-treemap').hide();
    $('#bar-chart').remove(); // Remove the canvas elements
    $('#line-chart').remove();
    $('#scatter-chart').remove();
    $('#pie-chart').remove();
    $('#histogram-chart').remove();
    $('#doughnut-chart').remove();
    $('#treemap-chart').remove();
    $('#bar-container').append('<canvas id="bar-chart" style="display:none; height: 150px; width: 100%;"></canvas>');
    $('#line-container').append('<canvas id="line-chart" style="display:none; height: 150px; width: 100%;"></canvas>');
    $('#scatter-container').append('<canvas id="scatter-chart" style="display:none; height: 150px; width: 100%;"></canvas>');
    $('#pie-container').append('<canvas id="pie-chart" style="display:none; height: 150px; width: 100%;"></canvas>');
    $('#histogram-container').append('<canvas id="histogram-chart" style="display:none; height: 150px; width: 100%;"></canvas>');
    $('#doughnut-container').append('<canvas id="doughnut-chart" style="display:none; height: 150px; width: 100%;"></canvas>');
    $('#treemap-container').append('<div id="treemap-chart" style="display:none; height: 400px; width: 100%;"></div>');
}

function resetVisualizationOptions() {
    $('#visualization-options').hide();
    $('#chart-type').val('');
    $('#x-axis').empty();
    $('#y-axis').empty();
    $('#z-axis-container').hide();
    $('#z-axis').empty();
}

function showNotification() {
    $('#notification-save').removeClass('hidden');
}

function dismissNotification() {
    $('#notification-save').addClass('hidden');
}

function saveDetails() {
    $.ajax({
        type: 'POST',
        url: '/save_db_details',
        data: { save: 'yes' },
        success: function(response) {
            if (response.success) {
                $('#notification-save').html('<div class="success">' + response.message + '</div>');
                setTimeout(function() {
                    dismissNotification();
                }, 2000);
            } else {
                $('#notification-save').html('<div class="error">' + response.message + '</div>');
            }
        }
    });
}

function downloadResults() {
    var queryResults = document.getElementById('query-results').innerText;
    var blob = new Blob([queryResults], { type: 'text/plain' });
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'query_results.xlsx';
    link.click();
}

function populateAxisOptions(columns) {
    $('#x-axis').empty();
    $('#y-axis').empty();
    columns.forEach(function(col) {
        $('#x-axis').append('<option value="' + col + '">' + col + '</option>');
        $('#y-axis').append('<option value="' + col + '">' + col + '</option>');
    });
}

function showVisualizationOptions() {
    $('#visualization-options').show();
}

function generateRandomColors(numColors) {
    var colors = [];
    for (var i = 0; i < numColors; i++) {
        var color = '#' + Math.floor(Math.random() * 16777215).toString(16);
        colors.push(color);
    }
    return colors;
}

function generateCharts() {
    var chartTypes = $('#chart-type').val();
    var xAxisColumn = $('#x-axis').val();
    var yAxisColumn = $('#y-axis').val();
    var zAxisColumn = $('#z-axis').val();

    // Clear previous charts and buttons
    clearCharts(); // Add this line

    var xLabels = [];
    var yData = [];
    var zData = [];

    $('#query-results table tbody tr').each(function() {
        var xValue = $(this).find('td').eq($('#x-axis')[0].selectedIndex).text();
        var yValue = $(this).find('td').eq($('#y-axis')[0].selectedIndex).text();
        if (xValue && !isNaN(yValue)) { // Check for valid data
            xLabels.push(xValue);
            yData.push(parseFloat(yValue));
            if ($('#z-axis').is(':visible')) {
                var zValue = $(this).find('td').eq($('#z-axis')[0].selectedIndex).text();
                if (zValue) {
                    zData.push(parseFloat(zValue));
                }
            }
        }
    });

    if (xLabels.length === 0 || yData.length === 0) {
        alert("No valid data to display. Please check your x-axis and y-axis selections.");
        return;
    }

    var colors = generateRandomColors(xLabels.length);

    chartTypes.forEach(function(chartType) {
        switch (chartType) {
            case 'pie':
                var pieCtx = document.getElementById('pie-chart').getContext('2d');
                new Chart(pieCtx, {
                    type: 'pie',
                    data: {
                        labels: xLabels,
                        datasets: [{
                            data: yData,
                            backgroundColor: colors
                        }]
                    },
                    options: {
                        legend: {
                            display: false
                        }
                    }
                });
                $('#pie-chart').show();
                $('#download-pie').show();
                break;
            case 'bar':
                var barCtx = document.getElementById('bar-chart').getContext('2d');
                new Chart(barCtx, {
                    type: 'bar',
                    data: {
                        labels: xLabels,
                        datasets: [{
                            label: yAxisColumn,
                            data: yData,
                            backgroundColor: colors,
                            borderColor: colors,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
                $('#bar-chart').show();
                $('#download-bar').show();
                break;
            case 'line':
                var lineCtx = document.getElementById('line-chart').getContext('2d');
                new Chart(lineCtx, {
                    type: 'line',
                    data: {
                        labels: xLabels,
                        datasets: [{
                            label: yAxisColumn,
                            data: yData,
                            borderColor: colors[0],
                            backgroundColor: colors[0],
                            fill: true
                        }]
                    }
                });
                $('#line-chart').show();
                $('#download-line').show();
                break;
            case 'scatter':
                $('#z-axis-container').show();
                var scatterCtx = document.getElementById('scatter-chart').getContext('2d');
                new Chart(scatterCtx, {
                    type: 'scatter',
                    data: {
                        datasets: [{
                            label: yAxisColumn,
                            data: xLabels.map((label, index) => ({ x: xLabels[index], y: yData[index], r: zData[index] || 5 })),
                            backgroundColor: colors,
                            borderColor: colors,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            x: {
                                type: 'linear',
                                position: 'bottom'
                            }
                        }
                    }
                });
                $('#scatter-chart').show();
                $('#download-scatter').show();
                break;
            case 'histogram':
                var histogramCtx = document.getElementById('histogram-chart').getContext('2d');
                new Chart(histogramCtx, {
                    type: 'bar',
                    data: {
                        labels: xLabels,
                        datasets: [{
                            label: yAxisColumn,
                            data: yData,
                            backgroundColor: colors,
                            borderColor: colors,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
                $('#histogram-chart').show();
                $('#download-histogram').show();
                break;
            case 'doughnut':
                var doughnutCtx = document.getElementById('doughnut-chart').getContext('2d');
                new Chart(doughnutCtx, {
                    type: 'doughnut',
                    data: {
                        labels: xLabels,
                        datasets: [{
                            data: yData,
                            backgroundColor: colors
                        }]
                    },
                    options: {
                        legend: {
                            display: false
                        }
                    }
                });
                $('#doughnut-chart').show();
                $('#download-doughnut').show();
                break;
            case 'treemap':
                var treemapCtx = document.getElementById('treemap-chart');
                var treemapData = xLabels.map((label, index) => ({
                    name: label,
                    value: yData[index]
                }));
                Highcharts.chart('treemap-chart', {
                    series: [{
                        type: 'treemap',
                        layoutAlgorithm: 'squarified',
                        data: treemapData
                    }],
                    title: {
                        text: 'Treemap'
                    }
                });
                $('#treemap-chart').show();
                $('#download-treemap').show();
                break;
        }
    });
}

function downloadChart(chartId) {
    var link = document.createElement('a');
    link.href = document.getElementById(chartId).toDataURL('image/png');
    link.download = chartId + '.png';
    link.click();
}

function downloadTreemap() {
    Highcharts.exportCharts([Highcharts.charts[0]], { type: 'image/png' });
}

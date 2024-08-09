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
    $('#chart-container').empty();
}

function resetVisualizationOptions() {
    $('#visualization-options').hide();
    $('#chart-type-container input[type="checkbox"]').prop('checked', false);
    $('#x-axis').empty();
    $('#y-axis').empty();
    $('#scatter-data').empty();
    $('#scatter-options').hide();
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
    link.download = 'query_results.csv';
    link.click();
}

function populateAxisOptions(columns) {
    $('#x-axis').empty();
    $('#y-axis').empty();
    $('#scatter-data').empty();
    columns.forEach(function(col) {
        $('#x-axis').append('<option value="' + col + '">' + col + '</option>');
        $('#y-axis').append('<option value="' + col + '">' + col + '</option>');
        $('#scatter-data').append('<option value="' + col + '">' + col + '</option>');
    });
}

$('#chart-type-container input[type="checkbox"]').on('change', function() {
    if ($(this).val() === 'scatter' && $(this).is(':checked')) {
        $('#scatter-options').show();
    } else if ($(this).val() === 'scatter' && !$(this).is(':checked')) {
        $('#scatter-options').hide();
    }
});

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
    var selectedCharts = $('#chart-type-container input[type="checkbox"]:checked').map(function() {
        return $(this).val();
    }).get();

    var xAxisColumn = $('#x-axis').val();
    var yAxisColumn = $('#y-axis').val();
    var scatterDataColumn = $('#scatter-data').val();

    clearCharts();

    var xLabels = [];
    var yData = [];
    var scatterData = [];

    $('#query-results table tbody tr').each(function() {
        var xValue = $(this).find('td').eq($('#x-axis')[0].selectedIndex).text();
        var yValue = $(this).find('td').eq($('#y-axis')[0].selectedIndex).text();
        var scatterValue = $(this).find('td').eq($('#scatter-data')[0].selectedIndex).text();
        if (xValue && !isNaN(yValue)) {
            xLabels.push(xValue);
            yData.push(parseFloat(yValue));
            scatterData.push(parseFloat(scatterValue));
        }
    });

    if (xLabels.length === 0 || yData.length === 0) {
        alert("No valid data to display. Please check your x-axis and y-axis selections.");
        return;
    }

    var colors = generateRandomColors(xLabels.length);

    // Function to create chart wrapper
    function createChartWrapper(chartId, chartType, options = {}) {
        var wrapperClass = selectedCharts.length === 1 ? 'single-chart-wrapper' : 'chart-wrapper';
        var chartWrapper = $(`<div class="${wrapperClass}"><canvas id="${chartId}"></canvas><button onclick="downloadChart('${chartId}')">Download ${chartType} Chart</button></div>`);
        $('#chart-container').append(chartWrapper);
        return chartWrapper.find('canvas')[0].getContext('2d');
    }

    if (selectedCharts.includes('bar')) {
        var barCtx = createChartWrapper('bar-chart', 'Bar');
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
    }

    if (selectedCharts.includes('line')) {
        var lineCtx = createChartWrapper('line-chart', 'Line');
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
    }




    if (selectedCharts.includes('histogram')) {
        var histogramCtx = createChartWrapper('histogram-chart', 'Histogram');
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
    }

    if (selectedCharts.includes('scatter')) {
        var scatterCtx = createChartWrapper('scatter-chart', 'Scatter');
        new Chart(scatterCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: scatterDataColumn,
                    data: scatterData.map((data, index) => ({
                        x: data,
                        y: yData[index]
                    })),
                    backgroundColor: colors
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
    }
    if (selectedCharts.includes('doughnut')) {
        var doughnutCtx = createChartWrapper('doughnut-chart', 'Doughnut');
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
    }

    if (selectedCharts.includes('pie')) {
        var pieCtx = createChartWrapper('pie-chart', 'Pie');
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
    }
}


$('#visualize-btn').on('click', function() {
    $('#visualization-options').show();
});

$('#generate-charts-btn').on('click', generateCharts);

function generateRandomColors(count) {
    var colors = [];
    for (var i = 0; i < count; i++) {
        var color = 'rgba(' + (Math.floor(Math.random() * 256)) + ',' + 
                    (Math.floor(Math.random() * 256)) + ',' + 
                    (Math.floor(Math.random() * 256)) + ', 0.6)';
        colors.push(color);
    }
    return colors;
}


function downloadChart(chartId) {
    var canvas = document.getElementById(chartId);
    var link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = chartId + '.png';
    link.click();
}



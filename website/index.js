const DAY_MS = 1000 * 3600 * 24;
const WEEK_MS = DAY_MS * 7;
const MONTH_MS = DAY_MS * 30;
const YEAR_MS = MONTH_MS * 12;
var now = new Date();
var filterType = "";

// Convert date strings for sorting
data.forEach(function(d) {
  var date = new Date(d.date);
  var month = date.getMonth() + 1;
  var monthStr = date.getMonth() < 10 ? `0${month}` : month;
  var day = date.getDate();
  var dayStr = day < 10 ? `0${day}` : day;
  d.sortable_date = `${date.getFullYear()}/${monthStr}/${dayStr}`
})

$.fn.dataTable.ext.search.push(
	function( settings, data, dataIndex ) {
	  var date = new Date(data[0]);
	  switch(filterType) {
		case "today":
		  return now.getTime() === date.getTime();
		case "week":
		  return now.getTime() - date.getTime() <= WEEK_MS;
		case "month":
		  return now.getTime() - date.getTime() <= MONTH_MS;
		case "year":
		  return now.getTime() - date.getTime() <= YEAR_MS;
		default:
		  return true;
	  }
	}
);

$(document).ready( function () {

  function format ( d ) {
		return d.split('\n').join('<br/><br/>').split('<br/><br/><br/><br/>').join('<br/><br/>');
  }

  var table = $('#urop-table').DataTable( {
	  data: data,
	  "lengthChange": false,
    "orderCellsTop": true,
	  "bAutoWidth": false,
	  "order": [[ 0, "desc" ]],
	  "columnDefs": [
		{"orderData": 5, "targets": 0},
		{"visible": false, "targets": [5, 6]}
	  ],
	  "pageLength": 8,
	  columns: [
		  { data: 'date' },
		  { data: 'term' },
		  { data: 'project_title' },
		  { data: 'department'},
		  { data: 'contact' },
			{ data: 'sortable_date'},
			{ data: 'search_text' }
	  ],
	  initComplete: function() {
		this.api().columns().every(function() {
		  var column = this;
		  var columnType = column.footer() ? column.footer().className : "";

		  switch(columnType) {
			case "select-date":
			  $(column.footer())
				.find('select')
				.on('change', function() {
				  now = new Date();
				  filterType = this.value;
				  column.draw();
				});
			  break;

			case "select-term":
			  $(column.footer())
				.find('select')
				.on('change', function() {
				  column
					.search(this.value ? this.value : "", true, false)
					.draw();
				});
			  break;

			case "search-text":
			  $('input', column.footer()).on('keyup change', function() {
				if (column.search() !== this.value) {
				  column
					.search(this.value)
					.draw();
				}
			  });
			  break;

			case "search-title":
				$('input', column.footer()).on('keyup change', function() {
					column
					.column(6)
					.search(this.value)
					.draw();
				});
				break;

			default:
			  break;
		  }
		});
	  }
  } );

  // Add event listener for opening and closing details
  $('#urop-table tbody').on('click', 'tr', function () {
	  var tr = $(this).closest('tr');
	  var row = table.row( tr );

	  if ( row.child.isShown() ) {
		  // This row is already open - close it
		  row.child.hide();
		  tr.removeClass('shown');
	  }
	  else {
		  // Open this row
		  var description = row.data()[0];
		  row.child(format(row.data()["project_desc"])).show();
		  tr.addClass('shown');
	  }
  } );
} );

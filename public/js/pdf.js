
  window.onload = function () {
    document.getElementById("download")
        .addEventListener("click", () => {
            const invoice = this.document.getElementById("invoice");
            console.log(invoice);
            console.log(window);
            var opt = {
                margin: 1,
                filename: `registration.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };
            html2pdf().from(invoice).set(opt).save();
        })
}

function export_data(){
    let data=document.getElementById('register_table');
    var fp=XLSX.utils.table_to_book(data,{sheet:'event'});
    XLSX.write(fp,{
      bookType:'xlsx',
      type:'base64'
    });
    XLSX.writeFile(fp, 'register.xlsx');
  }







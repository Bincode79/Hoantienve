const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'RefundRequestManagement.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace Root <Card>
content = content.replace(/<Card>/, `<div className="w-full bg-white rounded-md overflow-hidden shadow-md border border-[#06427D]">`);
content = content.replace(/<\/Card>(\s*);?\s*}\s*$/, `</div>\n  );\n}\n`);

// Replace Header and Filter Section (~ line 689)
const headerRegex = /<div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">[\s\S]*?<h3 className="font-bold text-black tracking-tight">Danh sách yêu cầu hoàn vé máy bay<\/h3>[\s\S]*?<div className="flex flex-wrap items-center gap-2">/m;

content = content.replace(headerRegex, `<div className="bg-[#06427D] py-2.5 px-4 flex items-center justify-between border-b border-[#0A73D1]">
        <div className="flex items-center gap-2">
          <TicketCheck size={20} className="text-white" />
          <h3 className="text-white font-bold text-[16px] uppercase font-sans tracking-wide">Quản lý hoàn vé máy bay</h3>
        </div>
      </div>
      <div className="p-4">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-3 bg-gray-50 p-2.5 border border-gray-200 rounded mb-3">
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">`);

// Close the filter section correctly. We wrapped it in `<div className="p-4">`, so we must close the table inside it.
// Replace `<div className="overflow-x-auto px-1">`
content = content.replace(/<div className="overflow-x-auto px-1">/, `<div className="overflow-x-auto border border-gray-200">`);

// Replace the Table Headers
const tableHeaderOld = /<table className="w-full text-left min-w-\[1000px\] border-separate border-spacing-y-2 px-6">[\s\S]*?<thead>[\s\S]*?<tr className="text-neutral-400 text-\[10px\] uppercase tracking-widest font-black">/m;
content = content.replace(tableHeaderOld, `<table className="w-full text-left text-[13px] text-gray-700 min-w-[1000px]">
            <thead>
              <tr className="bg-[#f5f5f5] text-[#0A58A3] border-b border-gray-300">`);

content = content.replace(/<tbody.*?>/, `<tbody className="divide-y divide-gray-200">`);

// Clean up table row styling
content = content.replace(/className=\{cn\([\s\S]*?"group\/row transition-all duration-300 hover:translate-x-1",[\s\S]*?\)\}/g, `className="hover:bg-blue-50 transition-colors"`);

content = content.replace(/className=\{cn\([\s\S]*?"px-4 py-4 rounded-l-2xl border-y border-l transition-colors"[\s\S]*?\)\}/g, `className="px-3 py-2.5 border-r border-gray-100 text-center"`);
content = content.replace(/className=\{cn\([\s\S]*?"px-4 py-4 border-y transition-colors"[\s\S]*?\)\}/g, `className="px-3 py-2.5 border-r border-gray-100"`);
content = content.replace(/className=\{cn\([\s\S]*?"px-4 py-4 border-y transition-colors text-center"[\s\S]*?\)\}/g, `className="px-3 py-2.5 border-r border-gray-100 text-center"`);
content = content.replace(/className=\{cn\([\s\S]*?"px-4 py-4 rounded-r-2xl border-y border-r transition-colors text-right"[\s\S]*?\)\}/g, `className="px-3 py-2.5 text-center"`);
content = content.replace(/className=\{cn\([\s\S]*?"px-4 py-4 border-y transition-colors font-black text-blue-600 dark:text-blue-400 text-sm"[\s\S]*?\)\}/g, `className="px-3 py-2.5 border-r border-gray-100 font-black text-[#FF6600]"`);

content = content.replace(/className="rounded-md border-neutral-300 dark:border-neutral-700 bg-transparent text-blue-600 focus:ring-blue-500"/g, `className="cursor-pointer"`);

// Remove the `</Card>` since we already replaced the ending at the top, wait, we replaced `</Card>` with `</div>`. Let's also wrap the pagination.
content = content.replace(/\{\!isLoading && filteredRequests\.length > requestsPerPage && \([\s\S]*?<Pagination currentPage=\{currentPage\} totalPages=\{totalPages\} onPageChange=\{setCurrentPage\} \/>[\s\S]*?\)\}/, `{!isLoading && filteredRequests.length > requestsPerPage && (
          <div className="mt-3">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}\n      </div>`);


fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated RefundRequestManagement.tsx');

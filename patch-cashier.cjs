const fs = require('fs');
const path = require('path');

const cashierPath = path.join(__dirname, 'src', 'pages', 'Cashier.tsx');
let content = fs.readFileSync(cashierPath, 'utf8');

// 1. Add state variables
content = content.replace(
  /const \[txDiscountValue, setTxDiscountValue\] = useState\(''\);/,
  `const [txDiscountValue, setTxDiscountValue] = useState('');
  const [txTaxType, setTxTaxType] = useState<'percentage' | 'nominal' | null>(null);
  const [txTaxValue, setTxTaxValue] = useState('');
  const [txServiceFeeType, setTxServiceFeeType] = useState<'percentage' | 'nominal' | null>(null);
  const [txServiceFeeValue, setTxServiceFeeValue] = useState('');
  const [taxDialogOpen, setTaxDialogOpen] = useState(false);
  const [serviceFeeDialogOpen, setServiceFeeDialogOpen] = useState(false);
  const [tempTaxType, setTempTaxType] = useState<'percentage' | 'nominal'>('percentage');
  const [tempTaxValue, setTempTaxValue] = useState('');
  const [tempServiceFeeType, setTempServiceFeeType] = useState<'percentage' | 'nominal'>('percentage');
  const [tempServiceFeeValue, setTempServiceFeeValue] = useState('');
  const [paymentMethodIdCheckout, setPaymentMethodIdCheckout] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if (storeSettings) {
      if (storeSettings.taxPercentage && !txTaxType) {
         setTxTaxType('percentage');
         setTxTaxValue(String(storeSettings.taxPercentage));
      }
      if (storeSettings.serviceFeePercentage && !txServiceFeeType) {
         setTxServiceFeeType('percentage');
         setTxServiceFeeValue(String(storeSettings.serviceFeePercentage));
      }
    }
  }, [storeSettings]);
  
  const playSound = () => {
    if (storeSettings?.soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };`
);

// 2. add to full reset
content = content.replace(
  /setTxDiscountValue\(''\);/,
  `setTxDiscountValue('');
    if (storeSettings?.taxPercentage) { setTxTaxType('percentage'); setTxTaxValue(String(storeSettings.taxPercentage)); } else { setTxTaxType(null); setTxTaxValue(''); }
    if (storeSettings?.serviceFeePercentage) { setTxServiceFeeType('percentage'); setTxServiceFeeValue(String(storeSettings.serviceFeePercentage)); } else { setTxServiceFeeType(null); setTxServiceFeeValue(''); }`
);

// 3. calculations
content = content.replace(
  /const total = Math\.max\(0, subtotal - txDiscountAmount\);/,
  `const subtotalAfterDiscount = Math.max(0, subtotal - txDiscountAmount);
  const txTaxAmount = txTaxType === 'percentage' ? subtotalAfterDiscount * Math.max(0, Number(txTaxValue) || 0) / 100 : txTaxType === 'nominal' ? Math.max(0, Number(txTaxValue) || 0) : 0;
  const txServiceFeeAmount = txServiceFeeType === 'percentage' ? subtotalAfterDiscount * Math.max(0, Number(txServiceFeeValue) || 0) / 100 : txServiceFeeType === 'nominal' ? Math.max(0, Number(txServiceFeeValue) || 0) : 0;
  const total = Math.max(0, subtotalAfterDiscount + txTaxAmount + txServiceFeeAmount);`
);

// 4. saveOpenBill payload
content = content.replace(
  /discountAmount: txDiscountAmount,/g,
  `discountAmount: txDiscountAmount,
        taxType: txTaxType,
        taxValue: Number(txTaxValue) || 0,
        taxAmount: txTaxAmount,
        serviceFeeType: txServiceFeeType,
        serviceFeeValue: Number(txServiceFeeValue) || 0,
        serviceFeeAmount: txServiceFeeAmount,`
);

content = content.replace(
  /setTxDiscountValue\(tx\.discountType \? String\(tx\.discountValue\) : ''\);/,
  `setTxDiscountValue(tx.discountType ? String(tx.discountValue) : '');
    setTxTaxType(tx.taxType || null);
    setTxTaxValue(tx.taxType ? String(tx.taxValue) : '');
    setTxServiceFeeType(tx.serviceFeeType || null);
    setTxServiceFeeValue(tx.serviceFeeType ? String(tx.serviceFeeValue) : '');`
);

// Add sound play
content = content.replace(
  /toast\.success\(t\('cashier\.toast\.transactionSuccess', \{ receiptNumber: updatedTx\?\.receiptNumber \}\)\);/,
  `playSound(); toast.success(t('cashier.toast.transactionSuccess', { receiptNumber: updatedTx?.receiptNumber }));`
);
content = content.replace(
  /toast\.success\(t\('cashier\.toast\.transactionSuccess', \{ receiptNumber \}\)\);/,
  `playSound(); toast.success(t('cashier.toast.transactionSuccess', { receiptNumber }));`
);

// Add hidden audio element
content = content.replace(
  /<div className="px-4 pt-6 pb-4 h-\[calc\(100vh-4rem\)\]">/,
  `<div className="px-4 pt-6 pb-4 h-[calc(100vh-4rem)]">
      <audio ref={audioRef} src="/cash-register.mp3" preload="auto" className="hidden" />`
);

// Add UI blocks in Cart
const cartUiBlock = `
              {txTaxAmount > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Pajak ({txTaxType === 'percentage' ? \`\${txTaxValue}%\` : 'Nominal'})</span>
                  <span>+{rp(txTaxAmount)}</span>
                </div>
              )}
              {txServiceFeeAmount > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Biaya Layanan ({txServiceFeeType === 'percentage' ? \`\${txServiceFeeValue}%\` : 'Nominal'})</span>
                  <span>+{rp(txServiceFeeAmount)}</span>
                </div>
              )}
`;

content = content.replace(
  /<\/div>\s*<div className="flex justify-between text-lg font-bold">/g,
  `</div>
              ${cartUiBlock}
              <div className="flex justify-between text-lg font-bold">`
);

// Add QRISGenerator in Checkout
content = content.replace(
  /import CustomerPicker from '@\/components\/CustomerPicker';/,
  `import CustomerPicker from '@/components/CustomerPicker';\nimport QRISGenerator from '@/components/QRISGenerator';`
);

content = content.replace(
  /<\/DialogHeader>\s*<div className="flex-1 overflow-y-auto p-6 pt-0 space-y-4">/,
  `</DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-4">
            {paymentMethodId && paymentMethods?.find(pm => pm.id === Number(paymentMethodId))?.category?.toLowerCase().includes('qris') && (
               <QRISGenerator amount={total} qrisPayload={storeSettings?.qrisPayload} />
            )}`
);

fs.writeFileSync(cashierPath, content);
console.log('Patched Cashier.tsx');

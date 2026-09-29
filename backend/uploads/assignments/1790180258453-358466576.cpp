#include <stdio.h> // นำเข้า library สำหรับ input/output (printf, scanf, FILE)

int n = 0; // ตัวแปร global เก็บจำนวนเกษตรกรทั้งหมด เริ่มต้น = 0

// ---- Struct สำหรับข้อมูลข้าว (ชนิดและราคา) ----
typedef struct {
  char breed[4][50];     // array ของชื่อสายพันธุ์ข้าว 4 ชนิด ชื่อไม่เกิน 50 ตัวอักษร
  float price_per_kg[4]; // array ของราคาต่อกิโลกรัมของข้าวแต่ละชนิด
} rice_data;

// ประกาศตัวแปร global พร้อมกำหนดค่าเริ่มต้นข้อมูลข้าวทั้ง 4 ชนิด
rice_data rice_dat = {
    {"Jasmine rice", "Kiew Ngu Sicky rice", "Sao Hai rice",
     "Sang Yod rice"},       // ชื่อข้าว 4 ชนิด
    {20.0, 10.0, 10.5, 15.0} // ราคาต่อ kg ของข้าวแต่ละชนิดตามลำดับ
};

// ---- Struct สำหรับวันเกิด / วันเก็บเกี่ยว ----
typedef struct {
  int day = 0, month = 0,
      year = 0; // วัน เดือน ปี เริ่มต้นเป็น 0 (C++ style, ใช้ใน C compiler บางตัว)
} birthday;

// ---- Struct สำหรับที่อยู่ ----
typedef struct {
  int house_num, group;  // บ้านเลขที่ และ หมู่บ้าน
  char subdistrict[100]; // ตำบล
  char district[100];    // อำเภอ
  char province[100];    // จังหวัด
  char road[100];        // ถนน
  char postalId[7];      // รหัสไปรษณีย์ (6 ตัวอักษร + null terminator)
} address;

// ---- Struct สำหรับข้อมูลข้าวของเกษตรกร ----
typedef struct {
  float rice_weight;    // น้ำหนักข้าว (kg)
  float cost;           // ราคารวมของข้าวชนิดนั้น
  birthday harvestDate; // วันที่เก็บเกี่ยว (ใช้ struct birthday)
} rice;

// ---- Struct หลักสำหรับข้อมูลเกษตรกร ----
typedef struct {
  char firstname[30]; // ชื่อจริง
  char lastname[30];  // นามสกุล
  char memberId[9];   // รหัสสมาชิก (8 ตัว + null)
  char gender[7];     // เพศ ("male" หรือ "female")
  int age;            // อายุ
  birthday bd;        // วันเกิด (ใช้ struct birthday)
  address addr;       // ที่อยู่ (ใช้ struct address)
  rice rices[4];      // ข้อมูลข้าว 4 ชนิดที่ขาย
  float total_cost;   // รายได้รวมทั้งหมด
} farmer;

// ---- ฟังก์ชัน แสดงเมนูข้าว ----
void riceMenu() {
  printf("---- Rice Menu ----\n"); // พิมพ์หัวข้อเมนู
  char ch = 'a';                   // เริ่มตัวอักษรตัวเลือกที่ 'a'
  for (int i = 0; i < 4; i++) {    // วนลูป 4 รอบ สำหรับข้าว 4 ชนิด
    printf("%c.) %s\t %.2f/kg\n",
           ch,                        // แสดงตัวอักษรตัวเลือก (a, b, c, d)
           rice_dat.breed[i],         // ชื่อสายพันธุ์ข้าว
           rice_dat.price_per_kg[i]); // ราคาต่อ kg (ทศนิยม 2 ตำแหน่ง)
    ch++;                             // เพิ่มตัวอักษรถัดไป (a→b→c→d)
  }
  printf("0.) to end\n"); // แสดงตัวเลือก 0 สำหรับออกจากเมนู
}

// ---- ฟังก์ชัน รับข้อมูลข้าวที่เกษตรกรจะขาย ----
void get_rice(farmer *fm) {      // รับ pointer ไปยัง struct farmer
  char choice = ' ';             // ตัวแปรเก็บตัวเลือกของผู้ใช้
  float weight = 0;              // ตัวแปรเก็บน้ำหนักข้าว
  printf("** Rice data ****\n"); // พิมพ์หัวข้อส่วนข้อมูลข้าว

  do {             // วนลูปจนกว่าผู้ใช้จะกด '0'
    riceMenu();    // แสดงเมนูข้าวให้ผู้ใช้เลือก
    fflush(stdin); // ล้าง input buffer ก่อนรับค่า
    printf("What rice will you sell: ");
    scanf("%c", &choice);
    // scanf("%c", &choice)
    //   %c  = format specifier สำหรับรับตัวอักษร (character) 1 ตัว
    //   &choice = address (ที่อยู่) ของตัวแปร choice
    //             scanf ต้องการ pointer เพื่อเขียนค่าที่รับได้กลับไปยังตัวแปร
    //             ถ้าไม่ใส่ & จะส่งค่าไปแทน address → โปรแกรมจะ crash
    //   ผู้ใช้พิมพ์เช่น: a แล้วกด Enter → choice = 'a'

    // ตรวจสอบว่า input อยู่ในช่วง a-d, A-D หรือ '0' เท่านั้น
    if (!((choice >= 'a' && choice <= 'd') ||
          (choice >= 'A' && choice <= 'D') || choice == '0')) {
      printf("Error!! your rice is out of range\n"); // แจ้ง error ถ้านอกช่วง
      continue; // กลับไปเริ่มลูปใหม่โดยไม่ทำงานต่อ
    }

    if (choice != '0') { // ถ้าไม่ใช่ '0' (ยังไม่หยุด)
      printf("How much does it weight: ");
      scanf("%f", &weight);
      // scanf("%f", &weight)
      //   %f  = format specifier สำหรับรับตัวเลขทศนิยม (float)
      //         รับได้ทั้งแบบ 100 หรือ 100.5 หรือ 100.50
      //   &weight = address ของตัวแปร weight (ชนิด float)
      //   ผู้ใช้พิมพ์เช่น: 50.5 แล้วกด Enter → weight = 50.5
    }

    switch (choice) { // แยกทำงานตามตัวเลือก
    case 'a':
    case 'A': // เลือกข้าว Jasmine rice (ตัวที่ 0)
      printf("Enter harvest date (dd mm yy): ");
      scanf("%d %d %d",
            &fm->rices[0].harvestDate.day,
            &fm->rices[0].harvestDate.month,
            &fm->rices[0].harvestDate.year);
      // scanf("%d %d %d", &day, &month, &year)
      //   %d %d %d = รับตัวเลขจำนวนเต็ม (int) 3 ตัว คั่นด้วย whitespace (เว้นวรรค/enter)
      //   &fm->rices[0].harvestDate.day   = address ของ field day ใน harvestDate ของข้าว index 0
      //   &fm->rices[0].harvestDate.month = address ของ field month
      //   &fm->rices[0].harvestDate.year  = address ของ field year
      //   fm->rices[0] = เข้าถึงข้าว Jasmine (index 0) ของ farmer ที่ fm ชี้ไป
      //   ผู้ใช้พิมพ์เช่น: 15 6 2567 แล้วกด Enter → day=15, month=6, year=2567
      fm->rices[0].rice_weight += weight;                     // บวกน้ำหนักสะสม
      fm->rices[0].cost += weight * rice_dat.price_per_kg[0]; // คำนวณราคา
      fm->total_cost += fm->rices[0].cost;                    // บวกเข้ารายได้รวม
      break;

    case 'b':
    case 'B': // เลือกข้าว Kiew Ngu Sicky rice (ตัวที่ 1)
      printf("Enter harvest date (dd mm yy): ");
      scanf("%d %d %d", &fm->rices[1].harvestDate.day,
            &fm->rices[1].harvestDate.month, &fm->rices[1].harvestDate.year);
      // รับวันที่เก็บเกี่ยวข้าว Kiew Ngu (index 1) เหมือนกับ case A
      //   %d %d %d = รับ int 3 ตัว (วัน เดือน ปี) คั่นด้วยเว้นวรรค
      //   &fm->rices[1].harvestDate.day/month/year = address ของแต่ละ field ใน rices[1]
      fm->rices[1].rice_weight += weight;
      fm->rices[1].cost += weight * rice_dat.price_per_kg[1];
      fm->total_cost += fm->rices[1].cost;
      break;

    case 'c':
    case 'C': // เลือกข้าว Sao Hai rice (ตัวที่ 2)
      printf("Enter harvest date (dd mm yy): ");
      scanf("%d %d %d", &fm->rices[2].harvestDate.day,
            &fm->rices[2].harvestDate.month, &fm->rices[2].harvestDate.year);
      // รับวันที่เก็บเกี่ยวข้าว Sao Hai (index 2)
      //   %d %d %d = รับ int 3 ตัว (วัน เดือน ปี)
      //   &fm->rices[2].harvestDate.day/month/year = address ของแต่ละ field ใน rices[2]
      fm->rices[2].rice_weight += weight;
      fm->rices[2].cost += weight * rice_dat.price_per_kg[2];
      fm->total_cost += fm->rices[2].cost;
      break;

    case 'd':
    case 'D': // เลือกข้าว Sang Yod rice (ตัวที่ 3)
      printf("Enter harvest date (dd mm yy): ");
      scanf("%d %d %d", &fm->rices[3].harvestDate.day,
            &fm->rices[3].harvestDate.month, &fm->rices[3].harvestDate.year);
      // รับวันที่เก็บเกี่ยวข้าว Sang Yod (index 3)
      //   %d %d %d = รับ int 3 ตัว (วัน เดือน ปี)
      //   &fm->rices[3].harvestDate.day/month/year = address ของแต่ละ field ใน rices[3]
      fm->rices[3].rice_weight += weight;
      fm->rices[3].cost += weight * rice_dat.price_per_kg[3];
      fm->total_cost += fm->rices[3].cost;
      break;

    default: // กรณีกด '0' หรือไม่ตรงกับกรณีใด
      break;
    }
  } while (choice != '0'); // ออกจากลูปเมื่อผู้ใช้กด '0'
}

// ---- ฟังก์ชัน บันทึกข้อมูลลงไฟล์ ----
void write_file(farmer *fm, int i) { // รับ pointer farmer และ index ลำดับที่
  FILE *fptr;                        // ประกาศตัวแปร pointer ของไฟล์
  fptr = fopen("Rice_Farmer.text",
               "a+"); // เปิดไฟล์แบบ append (ต่อท้าย) หรือสร้างใหม่ถ้าไม่มี

  fprintf(fptr, "Farmer no#%d\n", i + 1);   // เขียนลำดับเกษตรกร
  fprintf(fptr, "** Personal data ****\n"); // หัวข้อข้อมูลส่วนตัว
  fprintf(fptr, "ID: %s\n", fm->memberId);  // รหัสสมาชิก
  fprintf(fptr, "Name: %s %s\n", fm->firstname, fm->lastname); // ชื่อ-นามสกุล
  fprintf(fptr, "Birthday: %02d / %02d / %04d\n", fm->bd.day, fm->bd.month,
          fm->bd.year);                // วันเกิด (format 2 หลัก / 2 หลัก / 4 หลัก)
  fprintf(fptr, "Age: %d\n", fm->age); // อายุ
  fprintf(fptr, "Gender: %s\n", fm->gender); // เพศ

  fprintf(fptr, "** Address data ****\n");                  // หัวข้อที่อยู่
  fprintf(fptr, "House number: %d\n", fm->addr.house_num);  // บ้านเลขที่
  fprintf(fptr, "Village group: %d\n", fm->addr.group);     // หมู่บ้าน
  fprintf(fptr, "Road: %s\n", fm->addr.road);               // ถนน
  fprintf(fptr, "Subdistrict: %s\n", fm->addr.subdistrict); // ตำบล
  fprintf(fptr, "District: %s\n", fm->addr.district);       // อำเภอ
  fprintf(fptr, "Province: %s\n", fm->addr.province);       // จังหวัด
  fprintf(fptr, "Postal ID: %s\n", fm->addr.postalId);      // รหัสไปรษณีย์

  fprintf(fptr, "** Rice data ****\n");         // หัวข้อข้อมูลข้าว
  for (int j = 0; j < 4; j++) {                 // วนลูป 4 รอบ สำหรับข้าวทุกชนิด
    fprintf(fptr, "%s\t\n", rice_dat.breed[j]); // ชื่อสายพันธุ์ข้าว
    fprintf(fptr, "\tHarvest date: %d / %d / %d\n",
            fm->rices[j].harvestDate.day,
            fm->rices->harvestDate
                .month, // ⚠️ BUG: ควรเป็น fm->rices[j].harvestDate.month
            fm->rices[j].harvestDate.year);                       // วันที่เก็บเกี่ยว
    fprintf(fptr, "\tWeight : %.2f\n", fm->rices[j].rice_weight); // น้ำหนัก
    fprintf(fptr, "\tCost : %.2f\n", fm->rices[j].cost);          // ราคา
  }
  fprintf(fptr, "Total cost: %.2f\n", fm->total_cost); // รายได้รวม
  fprintf(fptr, "=============================================================="
                "============================\n"); // เส้นคั่น
  fclose(fptr); // ปิดไฟล์ (สำคัญมาก! ป้องกันข้อมูลสูญหาย)
}

// ---- ฟังก์ชัน รับข้อมูลเกษตรกร ----
void get_data(farmer *fm, int i) { // รับ pointer farmer และ index ลำดับที่
  printf("** Personal data ****\n");
  printf("Enter member id: ");
  scanf("%s", &fm->memberId);
  // scanf("%s", &fm->memberId)
  //   %s = format specifier สำหรับรับ string (ข้อความ) หยุดรับเมื่อเจอ whitespace
  //   &fm->memberId = address ของ array memberId ใน struct farmer
  //   fm->memberId เป็น char[9] รับได้สูงสุด 8 ตัวอักษร + null terminator '\0'
  //   ผู้ใช้พิมพ์เช่น: FM000001 แล้วกด Enter → memberId = "FM000001"
  printf("Enter first name: ");
  scanf("%s", &fm->firstname);
  // scanf("%s", &fm->firstname)
  //   %s = รับ string หยุดที่เว้นวรรค (ดังนั้นรับได้แค่คำเดียว ไม่มีช่องว่าง)
  //   &fm->firstname = address ของ char array firstname[30]
  //   ผู้ใช้พิมพ์เช่น: Somchai → firstname = "Somchai"
  printf("Enter last name: ");
  scanf("%s", &fm->lastname);
  // scanf("%s", &fm->lastname)
  //   %s = รับ string 1 คำ (หยุดที่เว้นวรรค)
  //   &fm->lastname = address ของ char array lastname[30]
  //   ผู้ใช้พิมพ์เช่น: Jaidee → lastname = "Jaidee"
  printf("Enter birthday(dd mm yy): ");
  scanf("%d %d %d", &fm->bd.day, &fm->bd.month, &fm->bd.year);
  // scanf("%d %d %d", &day, &month, &year)
  //   %d %d %d = รับจำนวนเต็ม (int) 3 ค่า คั่นด้วยเว้นวรรค
  //   &fm->bd.day   = address ของ field day ใน struct birthday bd ของ farmer
  //   &fm->bd.month = address ของ field month
  //   &fm->bd.year  = address ของ field year
  //   ผู้ใช้พิมพ์เช่น: 1 1 2543 → day=1, month=1, year=2543
  printf("Enter gender (male/female): ");
  scanf("%s", &fm->gender);
  // scanf("%s", &fm->gender)
  //   %s = รับ string 1 คำ
  //   &fm->gender = address ของ char array gender[7]
  //   รับได้ "male" (4 ตัว) หรือ "female" (6 ตัว) + null = ไม่เกิน 7 ช่อง
  //   ผู้ใช้พิมพ์เช่น: male → gender = "male"
  printf("Enter age: ");
  scanf("%d", &fm->age);
  // scanf("%d", &fm->age)
  //   %d = รับจำนวนเต็ม (int) 1 ค่า
  //   &fm->age = address ของ field age (int) ใน struct farmer
  //   ผู้ใช้พิมพ์เช่น: 45 → age = 45

  printf("** Address ****\n");
  printf("Enter house number: ");
  scanf("%d", &fm->addr.house_num);
  // scanf("%d", &fm->addr.house_num)
  //   %d = รับจำนวนเต็ม (int)
  //   &fm->addr.house_num = address ของ field house_num ใน struct address ที่ซ้อนอยู่ใน farmer
  //   fm->addr เข้าถึง struct address ก่อน แล้ว .house_num เข้าถึง field นั้น
  //   ผู้ใช้พิมพ์เช่น: 123 → house_num = 123
  printf("Enter village group: ");
  scanf("%d", &fm->addr.group);
  // scanf("%d", &fm->addr.group)
  //   %d = รับจำนวนเต็ม (int)
  //   &fm->addr.group = address ของ field group (หมู่บ้านที่) ใน struct address
  //   ผู้ใช้พิมพ์เช่น: 5 → group = 5
  printf("Enter subdistrict: ");
  scanf("%s", &fm->addr.subdistrict);
  // scanf("%s", &fm->addr.subdistrict)
  //   %s = รับ string 1 คำ (ไม่มีเว้นวรรค)
  //   &fm->addr.subdistrict = address ของ char array subdistrict[100]
  //   ผู้ใช้พิมพ์เช่น: Nongkhai → subdistrict = "Nongkhai"
  printf("Enter district: ");
  scanf("%s", &fm->addr.district);
  // scanf("%s", &fm->addr.district)
  //   %s = รับ string ชื่ออำเภอ
  //   &fm->addr.district = address ของ char array district[100]
  printf("Enter road: ");
  scanf("%s", &fm->addr.road);
  // scanf("%s", &fm->addr.road)
  //   %s = รับ string ชื่อถนน
  //   &fm->addr.road = address ของ char array road[100]
  printf("Enter province: ");
  scanf("%s", &fm->addr.province);
  // scanf("%s", &fm->addr.province)
  //   %s = รับ string ชื่อจังหวัด
  //   &fm->addr.province = address ของ char array province[100]
  printf("Enter postal id: ");
  scanf("%s", &fm->addr.postalId);
  // scanf("%s", &fm->addr.postalId)
  //   %s = รับ string รหัสไปรษณีย์
  //   &fm->addr.postalId = address ของ char array postalId[7]
  //   รับได้ 6 ตัวอักษร + null terminator พอดี
  //   ผู้ใช้พิมพ์เช่น: 430000 → postalId = "430000"

  get_rice(fm);      // เรียกฟังก์ชันรับข้อมูลข้าว
  write_file(fm, i); // เรียกฟังก์ชันบันทึกข้อมูลลงไฟล์
}

// ---- ฟังก์ชัน แสดงข้อมูลเกษตรกรทั้งหมดบนหน้าจอ ----
void show_data(farmer *fm) { // รับ array ของ farmer
  printf("\n=========== Show Data ===========\n");
  for (int i = 0; i < n; i++) { // วนลูปตามจำนวนเกษตรกรทั้งหมด
    printf("Farmer no#%d\n", i + 1);
    printf("** Personal data ****\n");
    printf("ID: %s\n", fm[i].memberId);
    printf("Name: %s %s\n", fm[i].firstname, fm[i].lastname);
    printf("Birthday: %02d / %02d / %04d\n", fm[i].bd.day, fm[i].bd.month,
           fm[i].bd.year);
    printf("Age: %d\n", fm[i].age);
    printf("Gender: %s\n", fm[i].gender);

    printf("** Address data ****\n");
    printf("House number: %d\n", fm[i].addr.house_num);
    printf("Village group: %d\n", fm[i].addr.group);
    printf("Road: %s\n", fm[i].addr.road);
    printf("Subdistrict: %s\n", fm[i].addr.subdistrict);
    printf("District: %s\n", fm[i].addr.district);
    printf("Province: %s\n", fm[i].addr.province);
    printf("Postal ID: %s\n", fm[i].addr.postalId);

    printf("** Rice data ****\n");
    for (int j = 0; j < 4; j++) {          // วนลูปแสดงข้อมูลข้าวทั้ง 4 ชนิด
      printf("%s\t\n", rice_dat.breed[j]); // ชื่อข้าว
      printf("\tHarvest date: %d / %d / %d\n", fm[i].rices[j].harvestDate.day,
             fm[i].rices[j].harvestDate.month,
             fm[i].rices[j].harvestDate.year);                 // วันเก็บเกี่ยว
      printf("\tWeight : %.2f\n", fm[i].rices[j].rice_weight); // น้ำหนัก
      printf("\tCost : %.2f\n", fm[i].rices[j].cost);          // ราคา
    }
    printf("Total cost: %.2f\n", fm[i].total_cost); // รายได้รวม
  }
}

// ---- ฟังก์ชัน main (จุดเริ่มต้นโปรแกรม) ----
main() { // ไม่ระบุ return type (แนะนำให้ใช้ int main())
  printf("=========== Welcome to SriFi Rice co. ===========\n"); // ข้อความต้อนรับ
  printf("Enter amount of farmner: ");
  scanf("%d", &n);
  // scanf("%d", &n)
  //   %d = รับจำนวนเต็ม (int)
  //   &n = address ของตัวแปร global n (จำนวนเกษตรกร)
  //   ผู้ใช้พิมพ์เช่น: 3 แล้วกด Enter → n = 3 (จะมีเกษตรกร 3 คน)

  farmer fm[n]; // ประกาศ array ของ farmer ขนาด n (VLA - Variable Length Array)

  for (int i = 0; i < n; i++) {      // วนลูปรับข้อมูลเกษตรกรทีละคน
    printf("Farmer no#%d\n", i + 1); // บอกลำดับที่กำลังกรอก
    get_data(&fm[i], i);             // เรียกฟังก์ชันรับข้อมูล ส่ง address ของ fm[i]
  }

  show_data(fm); // แสดงข้อมูลเกษตรกรทั้งหมดบนหน้าจอ
}

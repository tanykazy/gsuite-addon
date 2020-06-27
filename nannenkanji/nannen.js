/**
 * Converts the input kanji into grade.
 *
 * @param {string} kanji input the kanji character to convert
 * @return {number} the input converted into grade
 */
function toGrade(kanji) {
  var grade = MAX_GRADE;

  for (var i = 0; i < TABLE.length; i++) {
    if (TABLE[i][POS_KANJI] == kanji) {
      grade = TABLE[i][POS_GRADE];
      break;
    }
  }

  return grade;
}

function test() {
  console.log(toGrade("一") == 1);//1
  console.log(toGrade("論") == 6);//6
  console.log(toGrade("和") == 3);//3
  console.log(toGrade("愛") == 4);//4
  console.log(toGrade("あ") == 0);//0
  console.log(toGrade(1) == 0);//0
  console.log(toGrade("") == 0);//0
  console.log(toGrade() == 0);//0
}

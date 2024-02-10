<?php
namespace App\Enums;

enum OrderStep: string
{
    case TEST_METHOD="test method";
    case PATIENT_DETAILS="patient details";
    case CLINICAL_DETAILS="clinical details";
    case SAMPLE_DETAILS="sample details";
    case CONSENT_FORM="consent form";
    case FINALIZE="finalize";

    function next(): string
    {
        $index=array_search($this, $this::cases()) ;
        if ($index<count($this::cases())-1) {
            return $this::cases()[$index+1]->value;
        }
        return $this->value;
    }

    static function first(): OrderStep
    {
        return self::cases()[0];
    }

}

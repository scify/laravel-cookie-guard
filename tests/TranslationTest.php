<?php

it('provides translations', function (): void {
    $this->assertTranslationExists('cookies_consent::messages.title');
    $this->assertTranslationExists('cookies_consent::messages.description');
});
